import { pool, query } from './pool.js';
import { hashPassword } from '../utils/password.js';
import { randomBytes, randomUUID } from 'node:crypto';
import * as lecturaService from '../modules/lecturas/lectura.service.js';

async function seed() {
  console.log('Iniciando seed...');

  // 1. Usuarios
  const adminCorreo = 'admin@agrosmart.ec';
  const existe = await query(`SELECT 1 FROM usuario WHERE correo = $1`, [adminCorreo]);
  if (existe.rowCount > 0) {
    console.log('El seed ya fue ejecutado (admin existe). Abortando para no duplicar.');
    return;
  }

  const adminHash = await hashPassword('admin12345');
  const agriHash = await hashPassword('agri12345');

  const { rows: [admin] } = await query(
    `INSERT INTO usuario (nombre, apellido, correo, contra_hash, rol)
     VALUES ('Eberson','Guayllas',$1,$2,'ADMINISTRADOR') RETURNING id_usuario`,
    [adminCorreo, adminHash]
  );
  const { rows: [agricultor] } = await query(
    `INSERT INTO usuario (nombre, apellido, correo, contra_hash, rol)
     VALUES ('Freddy','Matailo','agricultor@agrosmart.ec',$1,'AGRICULTOR') RETURNING id_usuario`,
    [agriHash]
  );
  console.log('Usuarios creados.');

  // 2. Perfiles agronomicos
  await query(
    `INSERT INTO perfil_agronomico
       (tipo_suelo, tipo_cultivo, umin_recomendado, umax_recomendado,
        umin_critico_recomendado, t_maximo_recomendado, tmin_recomendado,
        descripcion_agronomica, fuente_referencia)
     VALUES
       ('HUMIFERO','HORTALIZAS',45,70,25,35,12,'Hortalizas en suelo humifero','FAO'),
       ('ARENOSO','FRUTOS_ROJOS',35,60,20,33,10,'Frutos rojos en suelo arenoso','INIAP'),
       ('ARCILLOSO','HORTALIZAS',50,75,30,34,12,'Hortalizas en suelo arcilloso','FAO')`
  );
  console.log('Perfiles agronomicos creados.');

  // 3. Parcela
  const { rows: [parcela] } = await query(
    `INSERT INTO parcela (nombre_descriptivo, tipo_suelo, tipo_cultivo, ubicacion_descriptiva, latitud, longitud, area_m2)
     VALUES ('Parcela Norte','HUMIFERO','HORTALIZAS','Sector La Banda, Loja',-3.99313,-79.20422,500)
     RETURNING id_parcela`
  );
  await query(`INSERT INTO parcela_asignada (usuario_id, parcela_id) VALUES ($1,$2)`,
    [agricultor.id_usuario, parcela.id_parcela]);
  console.log('Parcela creada y asignada al agricultor.');

  // 4. Nodo con credencial
  const identificador = `nodo_${randomUUID().slice(0, 8)}`;
  const secreto = randomBytes(24).toString('hex');
  const secretoHash = await hashPassword(secreto);
  const { rows: [nodo] } = await query(
    `INSERT INTO nodo (parcela_id, tipo_sensor, modelo_hardware, ubicacion_descriptiva, estado)
     VALUES ($1,'COMBINADO','ESP32-DHT22','Centro de la parcela','ACTIVO')
     RETURNING id_nodo`,
    [parcela.id_parcela]
  );
  await query(
    `INSERT INTO credencial_nodo (nodo_id, tipo_credencial, identificador, secreto_hash)
     VALUES ($1,'USUARIO_CONTRA',$2,$3)`,
    [nodo.id_nodo, identificador, secretoHash]
  );
  console.log('Nodo creado.');

  // 5. Actuador y configuracion de riego
  await query(`INSERT INTO actuador (parcela_id, tipo) VALUES ($1,'RELE_BOMBA')`, [parcela.id_parcela]);
  await query(
    `INSERT INTO configuracion_riego
       (parcela_id, umin, umax, umin_critico, t_maximo, tmin, modalidad_configuracion)
     VALUES ($1,45,70,25,35,12,'MANUAL')`,
    [parcela.id_parcela]
  );
  console.log('Actuador y configuracion de riego creados.');

  // 6. Lecturas historicas (48 horas, una cada 30 min) pasadas por el AFD real
  console.log('Generando lecturas historicas (esto puede tardar unos segundos)...');
  let humedad = 60;
  const ahora = Date.now();
  const totalPuntos = 96; // 48h * 2 por hora
  let generadas = 0;

  for (let i = totalPuntos; i >= 0; i--) {
    const minutosAtras = i * 30;
    const hora = new Date(ahora - minutosAtras * 60 * 1000).getHours();

    // El suelo se seca con el tiempo; el riego lo recupera (lo decide el AFD via actuador)
    humedad -= 1.2 + Math.random() * 0.8;
    if (humedad < 15) humedad = 15;

    // Temperatura sigue un ciclo diario simple
    const temperatura = 18 + 9 * Math.sin(((hora - 6) / 24) * 2 * Math.PI) + (Math.random() * 2 - 1);

    const resultado = await lecturaService.ingestar(nodo.id_nodo, {
      humedad: Math.round(humedad * 10) / 10,
      temperatura: Math.round(temperatura * 10) / 10,
    });
    generadas++;

    // Si el AFD activo el riego, simulamos que la humedad sube
    if (resultado?.transicion?.accionActuador === 'ENCENDER') {
      humedad = 68 + Math.random() * 4;
    }
  }
  console.log(`${generadas} lecturas historicas generadas.`);

  console.log('\n========================================');
  console.log('SEED COMPLETADO');
  console.log('----------------------------------------');
  console.log('Admin:       admin@agrosmart.ec / admin12345');
  console.log('Agricultor:  agricultor@agrosmart.ec / agri12345');
  console.log('----------------------------------------');
  console.log('Credenciales del nodo (para el dispositivo IoT):');
  console.log(`  x-node-id:     ${identificador}`);
  console.log(`  x-node-secret: ${secreto}`);
  console.log('========================================\n');
}

seed()
  .catch((err) => { console.error('Error en seed:', err); process.exitCode = 1; })
  .finally(async () => { await pool.end(); });