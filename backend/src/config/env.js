import dotenv from 'dotenv';

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // Configuración de la base de datos
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  },

  // Configuración de JWT
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },

  // Seguridad
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  // Configuración MQTT
  mqtt: {
    url: process.env.MQTT_URL ?? 'mqtts://localhost:8883',
    username: process.env.MQTT_USERNAME ?? '',
    password: process.env.MQTT_PASSWORD ?? '',
    caPath: process.env.MQTT_CA_PATH ?? '',
    enabled: (process.env.MQTT_ENABLED ?? 'false') === 'true',
    passwdFile: process.env.MQTT_PASSWD_FILE ?? '',
    autoRegister: (process.env.MQTT_AUTO_REGISTER ?? 'false') === 'true',
  },
};