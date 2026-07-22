#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>
#include <esp_task_wdt.h>

// ============================================
// CERTIFICADO CA de Mosquitto en GCP (solo se usa con USAR_TLS 1)
// ============================================
const char* CA_CERT = R"EOF(-----BEGIN CERTIFICATE-----
MIIDbzCCAlegAwIBAgIUAz2IXHQFyIdXL8wUaUEoMD/uMWEwDQYJKoZIhvcNAQEL
BQAwRzELMAkGA1UEBhMCRUMxDTALBgNVBAgMBExvamExEjAQBgNVBAoMCUFncm9T
bWFydDEVMBMGA1UEAwwMQWdyb1NtYXJ0LUNBMB4XDTI2MDcyMDE5MjMxMloXDTM2
MDcxNzE5MjMxMlowRzELMAkGA1UEBhMCRUMxDTALBgNVBAgMBExvamExEjAQBgNV
BAoMCUFncm9TbWFydDEVMBMGA1UEAwwMQWdyb1NtYXJ0LUNBMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwISlp7/qtqF2MXQJHTn5ssUCTtIKahpTWGde
NDeuyvyEin4++ZmA9Tz6Pjo9O+fxjIwEBFSuzPpY1A3qUgBPxBfAamKY3gRX/++v
UzdpiHanm3HIKAYFPxn3T2d2NIviVkQ1fvBh8DLq+1ROfLaeJrsRb7ugvMMkUA1g
q2FVsWLSWPMYGQFH6hFyE1HEOG+WhDYOLljd8I/FBe7mAVKSmYi2GTV8Dyqo7wPv
cYMJWqQibAy7TJYPimLZkyUTL5XtOQrR3rGx3I6gXxF7UT8wmmCB61PF92IB5hue
qfBU8vZwI4Zy+ympy5RM+LuYOOE6wLFPS3WSQ/dJQ0p98YuC6QIDAQABo1MwUTAd
BgNVHQ4EFgQUf+3f5i1jSPchjwovPfR/nDnxyN4wHwYDVR0jBBgwFoAUf+3f5i1j
SPchjwovPfR/nDnxyN4wDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC
AQEAVTI+CXEXNpqoOTftGbXPuIOhPjbgXK6km9TXM1CvgXm1q7G0YO4fJsSE49MC
gIfK2TbeVLIGNSEAsoV/4JJ3LFPovl5xIEiuVfjZxFsNo4VHcAXbVo3QkXGgh2zu
qshSmwmMzE7hnHXSOlY/lqfTG8fj6kIjWCu3pf8voLhtFRKat0YFxWETT/MWh6gj
+zWjaSow2KhHrIfkkK2YWgL+oM6/E0KKXRNbBYMMyOfYRdoXIZzdhfICiO41MZLh
50G5Y4riIWkbtfPqXZMj1fK9wvia33YZo5HQ48cvaMgf9eyDi3tAHukEqC4XYXGj
r3RK4gZGjlvU+315p8s7j8JNsQ==
-----END CERTIFICATE-----)EOF";

// El handshake TLS contra el broker de la nube (por internet, via el
// hotspot) a veces tarda mas de lo que tardaba el broker local (misma LAN,
// sin TLS). Un watchdog de 4s -como el del sketch local- se dispara a mitad
// del handshake y reinicia el ESP32. Le damos mas margen aqui.
#define WDT_TIMEOUT_MS 20000

// ============================================
// 1 = broker en la nube (GCP) con TLS -> produccion
// 0 = broker local (mosquitto de esta PC) sin TLS -> pruebas
// ============================================
#define USAR_TLS 1

// const char* WIFI_SSID     = "Nettplus_Mari Pinta";
// const char* WIFI_PASSWORD = "ANSal8219";
const char* WIFI_SSID = "iPhone de Joel";
const char* WIFI_PASSWORD = "123456789";

#if USAR_TLS
const char* MQTT_HOST = "35.254.139.188";
const uint16_t MQTT_PORT = 8883;
#else
// IP de la PC que corre el backend/broker en la red del hotspot "iPhone de
// Joel" (subred 172.20.10.0/28). Si cambias de PC o de hotspot, actualiza esto.
const char* MQTT_HOST = "172.20.10.5";
const uint16_t MQTT_PORT = 1884;  // listener sin TLS del mosquitto local
#endif

// Identidad del nodo. Este es el nodo de la NUBE (nodo_d71481c3), corriendo
// ahora la misma logica autonoma (con cuenta regresiva y evaluacion) que el
// nodo local, pero reportando al backend en GCP via TLS.
// const char* NODO_UUID   = "8daae064-741a-4f07-997b-b869925cfdff";  // nodo local
// const char* NODO_IDENT  = "nodo_c6bc0a04";
// const char* NODO_SECRET = "388f4eefe5f880061ff0d184a270754f884a896c49e89fb2";
// const char* PARCELA_ID  = "06d0d021-6149-4e60-aae1-218caf1561b8";
const char* NODO_UUID     = "542f7415-0e42-4c39-98da-b9a46aa1d5d5";
const char* NODO_IDENT    = "nodo_d71481c3";
const char* NODO_SECRET   = "0981af9aa34ad6781bc8bc183138a02309e5f316df9029cc";
const char* PARCELA_ID    = "db1b523a-fe82-4b1e-94db-075c9a4e4eab";

// CALIBRACION: Valor ADC cuando el sensor esta en aire (seco) -- propia de
// este sensor/hardware de la nube, no la copies del sketch local.
const int HUM_SECO = 3196;
// Valor ADC cuando el sensor esta en agua (humedo)
const int HUM_HUMEDO = 1965;

// Umbrales de riego (se reciben via MQTT .../config, estos son defaults)
float umbralMin = 50.0;
float umbralMax = 70.0;
const float TEMP_EMERGENCIA = 45.0;

const int PIN_HUMEDAD = 0;
const int PIN_DS18B20 = 3;
const int PIN_RELE = 4;

const unsigned long INTERVALO_PUBLICACION = 5000;
const unsigned long DURACION_SENSING = 5000;
const unsigned long DURACION_NORMAL = 5000;
const unsigned long DURACION_COUNTDOWN = 5000;
const unsigned long DURACION_IRRIGACION = 3000;
const unsigned long DURACION_WAITING = 5000;

enum FaseRiego {
  SENSING,
  NORMAL,
  COUNTDOWN,
  IRRIGATING,
  WAITING
};

#if USAR_TLS
WiFiClientSecure netClient;
#else
WiFiClient netClient;
#endif
PubSubClient mqttClient(netClient);
OneWire oneWire(PIN_DS18B20);
DallasTemperature ds18b20(&oneWire);

FaseRiego fase = SENSING;
unsigned long cambioFase = 0;
int segundosRestantes = 0;
long sumaADC = 0;
int muestrasADC = 0;
bool bombaActiva = false;
bool emergenciaLocal = false;
bool calibrando = false;
bool overrideManual = false;
float ultimaTempValida = NAN;
unsigned long ultimaPublicacion = 0;

// Ticker de "Evaluacion": mientras el nodo esta muestreando (SENSING) o
// esperando el siguiente ciclo (NORMAL), publica una cuenta regresiva 10..1
// en bucle para que el dashboard muestre "Evaluacion" en vivo en vez de
// quedarse sin datos entre riegos.
unsigned long ultimoTickEvaluacion = 0;
int segundosEvaluacion = 10;

String topicTelemetria, topicEstado, topicComandos, topicConfig, topicRiegoStatus;

// Polaridad del rele: este modulo (el de la nube) tambien resulto activo en
// ALTO (HIGH enciende la bomba). Si cambias de modulo y vuelve a quedar
// invertido, cambia solo esta constante.
const bool RELE_ACTIVO_BAJO = false;

void bombaEncender() {
  digitalWrite(PIN_RELE, RELE_ACTIVO_BAJO ? LOW : HIGH);
}

void bombaApagar() {
  digitalWrite(PIN_RELE, RELE_ACTIVO_BAJO ? HIGH : LOW);
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n=== AgroSmart ESP32-C3 v3 (Autonomo - Nube) ===");
  Serial.println("Escribe C + Enter para modo calibracion");
  Serial.printf("NODO UUID: %s\n", NODO_UUID);

  esp_task_wdt_config_t wdt_config = {
    .timeout_ms = WDT_TIMEOUT_MS,
    .idle_core_mask = 0,
    .trigger_panic = true
  };
  esp_task_wdt_init(&wdt_config);
  esp_task_wdt_add(NULL);
  esp_task_wdt_reset();
  Serial.printf("Watchdog: %ds\n", WDT_TIMEOUT_MS / 1000);

  pinMode(PIN_RELE, OUTPUT);
  bombaApagar();

  analogReadResolution(12);
  ds18b20.begin();
  ds18b20.setWaitForConversion(false);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  topicTelemetria = "agrosmart/parcela/" + String(PARCELA_ID) + "/nodo/" + NODO_UUID + "/telemetria";
  topicEstado = "agrosmart/parcela/" + String(PARCELA_ID) + "/nodo/" + NODO_UUID + "/estado";
  topicComandos = "agrosmart/parcela/" + String(PARCELA_ID) + "/nodo/" + NODO_UUID + "/comandos";
  topicConfig = "agrosmart/parcela/" + String(PARCELA_ID) + "/nodo/" + NODO_UUID + "/config";
  topicRiegoStatus = "agrosmart/parcela/" + String(PARCELA_ID) + "/nodo/" + NODO_UUID + "/riegostatus";

  conectarWiFi();

#if USAR_TLS
  // Sincronizar hora NTP (necesario para verificacion TLS)
  Serial.println("Sincronizando hora NTP...");
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  time_t now = 0;
  int intentosNtp = 0;
  while (now < 1000000000 && intentosNtp < 20) {
    delay(500);
    time(&now);
    intentosNtp++;
    esp_task_wdt_reset();
  }
  Serial.printf("Hora sincronizada: %ld\n", (long)now);

  netClient.setCACert(CA_CERT);
#endif

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(1024);
  // Tope propio de PubSubClient por debajo del watchdog: si el handshake TLS
  // se cuelga, que PubSubClient se rinda solo antes de que dispare el panic.
  mqttClient.setSocketTimeout(10);
  mqttClient.setCallback(onMensajeMQTT);
}

void loop() {
  esp_task_wdt_reset();

  if (Serial.available()) {
    char c = Serial.read();
    if (c == 'C' || c == 'c') {
      calibrando = !calibrando;
      if (calibrando) {
        Serial.println("\n=== MODO CALIBRACION ACTIVADO ===");
        Serial.println("Sensor al AIRE  -> espera 3s, leo valor...");
        Serial.println("Sensor en AGUA  -> espera 3s, leo valor...");
        Serial.println("Escribe C otra vez para salir.");
      } else {
        Serial.println("=== MODO CALIBRACION DESACTIVADO ===");
      }
    }
  }

  if (calibrando) {
    static unsigned long t = 0;
    if (millis() - t >= 3000) {
      t = millis();
      long suma = 0;
      for (int i = 0; i < 16; i++) {
        suma += analogRead(PIN_HUMEDAD);
        delay(2);
      }
      int adc = suma / 16;
      Serial.printf("ADC crudo = %d\n", adc);
    }
    delay(10);
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  if (!mqttClient.connected()) {
    conectarMQTT();
  }
  mqttClient.loop();

  unsigned long ahora = millis();

  // Maquina de estados autonomos
  ejecutarFase(ahora);
  actualizarTickerEvaluacion(ahora);

  // Publicar telemetria cada INTERVALO_PUBLICACION
  if (ahora - ultimaPublicacion >= INTERVALO_PUBLICACION) {
    ultimaPublicacion = ahora;
    publicarLectura();
  }
}

void actualizarTickerEvaluacion(unsigned long ahora) {
  // WAITING entra justo despues de "Riego completado": lo incluimos aqui
  // para que esa pantalla sea breve y el nodo pase enseguida a Evaluacion,
  // en vez de quedarse fijo en "Riego finalizado" durante toda la espera.
  if (fase != SENSING && fase != NORMAL && fase != WAITING) {
    segundosEvaluacion = 10;
    ultimoTickEvaluacion = 0;
    return;
  }
  if (ahora - ultimoTickEvaluacion < 1000) return;
  ultimoTickEvaluacion = ahora;

  char msg[40];
  snprintf(msg, sizeof(msg), "Evaluando condiciones: %d", segundosEvaluacion);
  publicarEstadoRiego("EVALUANDO", msg, segundosEvaluacion);

  segundosEvaluacion--;
  if (segundosEvaluacion < 1) segundosEvaluacion = 10;
}

void ejecutarFase(unsigned long ahora) {
  switch (fase) {
    case SENSING:
      {
        // Acumular muestras durante DURACION_SENSING
        if (cambioFase == 0) {
          cambioFase = ahora;
          sumaADC = 0;
          muestrasADC = 0;
          Serial.println("[SENSING] Muestreando...");
        }
        if (ahora - cambioFase >= 1000 / 8) {
          cambioFase = ahora;
          sumaADC += analogRead(PIN_HUMEDAD);
          muestrasADC++;
        }
        if (muestrasADC >= 40) {
          // 40 muestras ~5s
          int adcPromedio = sumaADC / muestrasADC;
          float humedad = (float)(HUM_SECO - adcPromedio) * 100.0 / (HUM_SECO - HUM_HUMEDO);
          if (humedad < 0) humedad = 0;
          if (humedad > 100) humedad = 100;
          Serial.printf("[SENSING] ADC=%d Humedad=%.0f%% UmbralMin=%.0f%%\n", adcPromedio, humedad, umbralMin);

          if (humedad < umbralMin && !emergenciaLocal && !overrideManual) {
            fase = COUNTDOWN;
            segundosRestantes = 5;
            cambioFase = ahora;
            publicarEstadoRiego("PREPARANDO", "Riego activandose en 5...", segundosRestantes);
            Serial.println("[SENSING] -> COUNTDOWN");
          } else {
            fase = NORMAL;
            cambioFase = ahora;
            if (!emergenciaLocal && !overrideManual) {
              publicarEstadoRiego("NORMAL", "Cultivo en condiciones normales", 0);
              Serial.println("[SENSING] -> NORMAL");
            } else {
              String causa = emergenciaLocal ? "Emergencia por temperatura" : "Override manual";
              publicarEstadoRiego("NORMAL", causa.c_str(), 0);
              Serial.printf("[SENSING] -> NORMAL (%s)\n", causa.c_str());
            }
          }
          muestrasADC = 0;
        }
        break;
      }
    case NORMAL:
      {
        if (ahora - cambioFase >= DURACION_NORMAL) {
          fase = SENSING;
          cambioFase = 0;
          Serial.println("[NORMAL] -> SENSING");
        }
        break;
      }
    case COUNTDOWN:
      {
        int segundo = 5 - ((ahora - cambioFase) / 1000);
        if (segundo != segundosRestantes && segundo >= 1) {
          segundosRestantes = segundo;
          char msg[40];
          snprintf(msg, sizeof(msg), "Riego activandose en %d...", segundo);
          publicarEstadoRiego("PREPARANDO", msg, segundo);
          Serial.printf("[COUNTDOWN] %d\n", segundo);
        }
        if (ahora - cambioFase >= DURACION_COUNTDOWN) {
          bombaEncender();
          bombaActiva = true;
          overrideManual = false;
          fase = IRRIGATING;
          cambioFase = ahora;
          publicarEstadoRiego("REGANDO", "Riego activado", 3);
          Serial.println("[COUNTDOWN] -> IRRIGATING (Bomba ON)");
        }
        break;
      }
    case IRRIGATING:
      {
        int segundo = 3 - ((ahora - cambioFase) / 1000);
        if (segundo >= 1 && segundo != segundosRestantes) {
          segundosRestantes = segundo;
          char msg[30];
          snprintf(msg, sizeof(msg), "Riego activado (%ds)", segundo);
          publicarEstadoRiego("REGANDO", msg, segundo);
        }

        // Verificar emergencia durante riego
        if (emergenciaLocal) {
          bombaApagar();
          bombaActiva = false;
          fase = WAITING;
          cambioFase = ahora;
          // Da un respiro de 1s antes de que el ticker de Evaluacion arranque,
          // para que "Riego finalizado" alcance a verse en el dashboard.
          ultimoTickEvaluacion = ahora;
          segundosEvaluacion = 10;
          publicarEstadoRiego("DETENIDO", "Riego detenido por emergencia", 0);
          Serial.println("[IRRIGATING] Emergencia! -> WAITING");
          break;
        }

        if (ahora - cambioFase >= DURACION_IRRIGACION) {
          bombaApagar();
          bombaActiva = false;
          fase = WAITING;
          cambioFase = ahora;
          // Da un respiro de 1s antes de que el ticker de Evaluacion arranque,
          // para que "Riego finalizado" alcance a verse en el dashboard.
          ultimoTickEvaluacion = ahora;
          segundosEvaluacion = 10;
          publicarEstadoRiego("DETENIDO", "Riego completado", 0);
          Serial.println("[IRRIGATING] -> WAITING (Bomba OFF)");
        }
        break;
      }
    case WAITING:
      {
        if (ahora - cambioFase >= DURACION_WAITING) {
          fase = SENSING;
          cambioFase = 0;
          Serial.println("[WAITING] -> SENSING");
        }
        break;
      }
  }
}

void conectarWiFi() {
  static unsigned long ultimoIntento = 0;
  if (millis() - ultimoIntento < 3000) return;
  ultimoIntento = millis();

  Serial.printf("WiFi %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  for (int i = 0; i < 40; i++) {
    if (WiFi.status() == WL_CONNECTED) break;
    delay(500);
    esp_task_wdt_reset();
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf(" OK (%s)\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println(" FAIL");
  }
}

void conectarMQTT() {
  if (!mqttClient.connect(NODO_UUID, NODO_IDENT, NODO_SECRET, topicEstado.c_str(), 1, true, "offline")) {
    Serial.printf("MQTT fail rc=%d\n", mqttClient.state());
    for (int i = 0; i < 10; i++) {
      delay(500);
      esp_task_wdt_reset();
    }
    return;
  }

  Serial.println("MQTT OK");
  mqttClient.publish(topicEstado.c_str(), "online", true);
  mqttClient.subscribe(topicComandos.c_str(), 1);
  mqttClient.subscribe(topicConfig.c_str(), 1);
  Serial.printf("Escuchando: %s\n", topicComandos.c_str());
  Serial.printf("Config topic: %s\n", topicConfig.c_str());
  delay(500);
}

void onMensajeMQTT(char* topic, byte* payload, unsigned int length) {
  String topico = String(topic);

  if (topico == topicConfig) {
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, payload, length)) return;

    if (doc.containsKey("umin")) {
      umbralMin = doc["umin"].as<float>();
      Serial.printf("[CONFIG] umbralMin = %.0f\n", umbralMin);
    }
    if (doc.containsKey("umax")) {
      umbralMax = doc["umax"].as<float>();
      Serial.printf("[CONFIG] umbralMax = %.0f\n", umbralMax);
    }
    return;
  }

  if (topico == topicComandos) {
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, payload, length)) return;

    const char* accion = doc["accion"] | "";

    if (strcmp(accion, "REGAR") == 0) {
      if (emergenciaLocal) return;
      // Override manual: salta a COUNTDOWN
      overrideManual = true;
      fase = COUNTDOWN;
      segundosRestantes = 5;
      cambioFase = millis();
      publicarEstadoRiego("PREPARANDO", "Riego manual en 5...", 5);
      Serial.println("[COMANDO] REGAR manual -> COUNTDOWN");
    } else if (strcmp(accion, "DETENER") == 0) {
      // Override manual: detiene inmediatamente
      overrideManual = true;
      bombaApagar();
      bombaActiva = false;
      fase = WAITING;
      cambioFase = millis();
      publicarEstadoRiego("DETENIDO", "Riego detenido manualmente", 0);
      Serial.println("[COMANDO] DETENER manual -> WAITING");
    }
    return;
  }
}

void publicarEstadoRiego(const char* estado, const char* mensaje, int segundos) {
  if (!mqttClient.connected()) {
    Serial.printf("[RIEGOSTATUS FAIL] %s - MQTT no conectado\n", mensaje);
    return;
  }

  StaticJsonDocument<128> doc;
  doc["estado"] = estado;
  doc["mensaje"] = mensaje;
  if (segundos > 0) doc["segundos"] = segundos;

  char buffer[128];
  size_t n = serializeJson(doc, buffer);

  if (mqttClient.publish(topicRiegoStatus.c_str(), buffer, n)) {
    Serial.printf("[RIEGOSTATUS] %s -> %s\n", estado, mensaje);
  } else {
    Serial.printf("[RIEGOSTATUS FAIL] %s\n", mensaje);
  }
}

float leerHumedad() {
  long suma = 0;
  for (int i = 0; i < 8; i++) {
    suma += analogRead(PIN_HUMEDAD);
    delay(5);
  }
  int adc = suma / 8;
  float pct = (float)(HUM_SECO - adc) * 100.0 / (HUM_SECO - HUM_HUMEDO);
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

float leerTemperatura() {
  ds18b20.requestTemperatures();
  unsigned long inicio = millis();
  while (!ds18b20.isConversionComplete() && millis() - inicio < 1500) {
    delay(5);
    esp_task_wdt_reset();
  }
  float t = ds18b20.getTempCByIndex(0);
  return (t == DEVICE_DISCONNECTED_C || t < -50 || t > 100) ? NAN : t;
}

void publicarLectura() {
  float humedad = leerHumedad();
  float temperatura = leerTemperatura();

  // Guardar ultimo valor valido para no perder la temperatura en el dashboard
  if (!isnan(temperatura)) {
    ultimaTempValida = temperatura;
  }
  float tempEnviar = isnan(temperatura) ? ultimaTempValida : temperatura;

  // Emergencia por temperatura (solo con lectura fresca valida)
  if (!isnan(temperatura) && temperatura > TEMP_EMERGENCIA) {
    if (!emergenciaLocal) {
      emergenciaLocal = true;
      if (bombaActiva) {
        bombaApagar();
        bombaActiva = false;
      }
      if (fase == COUNTDOWN || fase == IRRIGATING) {
        fase = WAITING;
        cambioFase = millis();
        publicarEstadoRiego("DETENIDO", "Emergencia: temperatura alta", 0);
      }
      Serial.printf("[EMERGENCIA] Temp=%.1fC sobre %dC\n", temperatura, TEMP_EMERGENCIA);
    }
  } else if (emergenciaLocal && !isnan(temperatura)) {
    emergenciaLocal = false;
    Serial.println("[EMERGENCIA] Temperatura normal, reanudando");
  }

  StaticJsonDocument<196> doc;
  doc["humedad"] = humedad;
  // Siempre enviar temperatura (usa ultimo valor valido si la lectura falla)
  if (!isnan(tempEnviar)) doc["temperatura"] = tempEnviar;
  doc["autonomo"] = true;
  doc["fase"] = (int)fase;

  char buffer[196];
  size_t n = serializeJson(doc, buffer);

  if (mqttClient.publish(topicTelemetria.c_str(), buffer, n)) {
    Serial.printf("H=%.0f%% T=%s B=%s Fase=%d\n",
                  humedad, isnan(tempEnviar) ? "N/A" : String(tempEnviar).c_str(),
                  bombaActiva ? "ON" : "OFF", (int)fase);
  } else {
    Serial.println("PUB FAIL");
  }
}
