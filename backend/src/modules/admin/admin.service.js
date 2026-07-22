import * as repo from './admin.repository.js';

export async function dashboardData(usuario) {
  const esAuditor = usuario.rol === 'AUDITOR';
  const empresa = esAuditor ? null : usuario.empresa;

  const [resumen, empresas, usuarios] = await Promise.all([
    repo.resumen(empresa, esAuditor),
    repo.empresasConDatos(empresa, esAuditor),
    repo.usuariosConFincas(empresa, esAuditor),
  ]);

  return { resumen, empresas, usuarios };
}
