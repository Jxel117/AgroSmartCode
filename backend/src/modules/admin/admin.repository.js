import { query } from '../../db/pool.js';

export async function resumen(empresaIdentificador = null, soloValidados = false) {
  const condiciones = [];
  const params = [];
  if (empresaIdentificador) {
    params.push(empresaIdentificador);
    condiciones.push(`empresa_identificador = $${params.length}`);
  }
  if (soloValidados) {
    condiciones.push('bloqueado = false');
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows: usuarios } = await query(
    `SELECT
       COUNT(*)::int AS total_usuarios,
       COUNT(*) FILTER (WHERE estado = 'ACTIVA')::int AS activos,
       COUNT(*) FILTER (WHERE estado = 'SUSPENDIDA')::int AS suspendidos
     FROM usuario ${where}`,
    params
  );
  const { rows: empresas } = await query(
    `SELECT COUNT(DISTINCT empresa_identificador)::int AS total
     FROM usuario WHERE empresa_identificador IS NOT NULL ${soloValidados ? 'AND bloqueado = false' : ''}`,
    []
  );
  return {
    totalEmpresas: Number(empresas[0]?.total ?? 0),
    totalUsuarios: Number(usuarios[0]?.total_usuarios ?? 0),
    activos: Number(usuarios[0]?.activos ?? 0),
    suspendidos: Number(usuarios[0]?.suspendidos ?? 0),
  };
}

export async function empresasConDatos(empresaIdentificador = null, soloValidados = false) {
  const condiciones = ['u.empresa_identificador IS NOT NULL'];
  const params = [];
  if (empresaIdentificador) {
    params.push(empresaIdentificador);
    condiciones.push(`u.empresa_identificador = $${params.length}`);
  }
  if (soloValidados) {
    condiciones.push('u.bloqueado = false');
  }
  const { rows } = await query(
    `SELECT
       u.empresa_identificador AS nombre,
       COUNT(DISTINCT u.id_usuario)::int AS total_usuarios,
       COALESCE(COUNT(DISTINCT p.id_parcela), 0)::int AS total_fincas
     FROM usuario u
     LEFT JOIN parcela p ON p.empresa_identificador = u.empresa_identificador
     WHERE ${condiciones.join(' AND ')}
     GROUP BY u.empresa_identificador
     ORDER BY u.empresa_identificador`,
    params
  );
  return rows.map((r) => ({
    nombre: r.nombre,
    totalUsuarios: r.total_usuarios,
    totalFincas: r.total_fincas,
  }));
}

export async function usuariosConFincas(empresaIdentificador = null, soloValidados = false) {
  const condiciones = [];
  const params = [];
  if (empresaIdentificador) {
    params.push(empresaIdentificador);
    condiciones.push(`u.empresa_identificador = $${params.length}`);
  }
  if (soloValidados) {
    condiciones.push('u.bloqueado = false');
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.correo_validacion,
            u.rol, u.estado, u.empresa_identificador,
            COALESCE(
              json_agg(
                json_build_object('id', p.id_parcela, 'nombre', p.nombre_descriptivo)
                ORDER BY p.nombre_descriptivo
              ) FILTER (WHERE p.id_parcela IS NOT NULL),
              '[]'::json
            ) AS fincas
     FROM usuario u
     LEFT JOIN parcela_asignada pa ON pa.usuario_id = u.id_usuario
     LEFT JOIN parcela p ON p.id_parcela = pa.parcela_id
     ${where}
     GROUP BY u.id_usuario, u.nombre, u.apellido, u.correo, u.correo_validacion,
              u.rol, u.estado, u.empresa_identificador
     ORDER BY u.apellido, u.nombre`,
    params
  );
  return rows.map((r) => ({
    id: r.id_usuario,
    nombre: r.nombre,
    apellido: r.apellido,
    correo: r.correo,
    correoValidacion: r.correo_validacion,
    rol: r.rol,
    estado: r.estado,
    empresaIdentificador: r.empresa_identificador,
    fincas: r.fincas,
  }));
}
