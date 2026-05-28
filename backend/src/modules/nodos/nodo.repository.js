import { query, withTransaction } from '../../db/pool.js';

const COLS = `id_nodo, parcela_id, tipo_sensor, modelo_hardware, ubicacion_descriptiva,
  latitud, longitud, protocolo_comunicacion, estado, fecha_registro, fecha_ultima_lectura`;

export async function findAll() {
  const { rows } = await query(`SELECT ${COLS} FROM nodo ORDER BY fecha_registro DESC`);
  return rows;
}

export async function findByParcela(parcelaId) {
  const { rows } = await query(`SELECT ${COLS} FROM nodo WHERE parcela_id = $1`, [parcelaId]);
  return rows;
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${COLS} FROM nodo WHERE id_nodo = $1`, [id]);
  return rows[0] ?? null;
}

// Busca el nodo a partir del identificador de credencial (lo usa la ingesta)
export async function findByCredencialIdentificador(identificador) {
  const { rows } = await query(
    `SELECT n.id_nodo, n.estado AS estado_nodo,
            c.secreto_hash, c.estado AS estado_credencial
     FROM credencial_nodo c
     JOIN nodo n ON n.id_nodo = c.nodo_id
     WHERE c.identificador = $1`,
    [identificador]
  );
  return rows[0] ?? null;
}

// Crea nodo + credencial en una transaccion
export async function createConCredencial(nodo, credencial) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO nodo
         (parcela_id, tipo_sensor, modelo_hardware, ubicacion_descriptiva,
          latitud, longitud, protocolo_comunicacion, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'SIN_CONFIGURAR')
       RETURNING ${COLS}`,
      [nodo.parcelaId, nodo.tipoSensor, nodo.modeloHardware, nodo.ubicacionDescriptiva,
       nodo.latitud, nodo.longitud, nodo.protocoloComunicacion]
    );
    const nuevoNodo = rows[0];

    await client.query(
      `INSERT INTO credencial_nodo (nodo_id, tipo_credencial, identificador, secreto_hash)
       VALUES ($1, 'USUARIO_CONTRA', $2, $3)`,
      [nuevoNodo.id_nodo, credencial.identificador, credencial.secretoHash]
    );

    return nuevoNodo;
  });
}

export async function update(id, d) {
  const { rows } = await query(
    `UPDATE nodo SET
       parcela_id=$2, tipo_sensor=$3, modelo_hardware=$4, ubicacion_descriptiva=$5,
       latitud=$6, longitud=$7, protocolo_comunicacion=$8, estado=$9
     WHERE id_nodo=$1
     RETURNING ${COLS}`,
    [id, d.parcelaId, d.tipoSensor, d.modeloHardware, d.ubicacionDescriptiva,
     d.latitud, d.longitud, d.protocoloComunicacion, d.estado]
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await query(`DELETE FROM nodo WHERE id_nodo = $1`, [id]);
  return rowCount > 0;
}

export async function actualizarEstado(id, estado) {
  const { rows } = await query(
    `UPDATE nodo SET estado = $2 WHERE id_nodo = $1 RETURNING id_nodo, estado`,
    [id, estado]
  );
  return rows[0] ?? null;
}