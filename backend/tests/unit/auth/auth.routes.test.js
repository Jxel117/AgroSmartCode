import router, {
  registrarEmpresaSchema,
  solicitarSchema,
  completarSchema
} from "../../../src/modules/auth/auth.routes.js";

describe("Auth Routes", () => {

  test("debe registrar las 8 rutas", () => {

    const rutas = router.stack
      .filter(layer => layer.route)
      .map(layer => layer.route.path);

    expect(rutas).toContain("/registro");
    expect(rutas).toContain("/login");
    expect(rutas).toContain("/logout");
    expect(rutas).toContain("/perfil");
    expect(rutas).toContain("/registrar-empresa");
    expect(rutas).toContain("/recuperar/solicitar");
    expect(rutas).toContain("/recuperar/verificar/:token");
    expect(rutas).toContain("/recuperar/completar/:token");

  });

});

describe("registrarEmpresaSchema", () => {

  test("acepta gmail válido", () => {

    expect(
      registrarEmpresaSchema.safeParse({
        nombre: "Juan",
        apellido: "Perez",
        correoValidacion: "juan@gmail.com",
        empresaIdentificador: "Empresa1"
      }).success
    ).toBe(true);

  });

  test("rechaza hotmail", () => {

    expect(
      registrarEmpresaSchema.safeParse({
        nombre: "Juan",
        apellido: "Perez",
        correoValidacion: "juan@hotmail.com",
        empresaIdentificador: "Empresa1"
      }).success
    ).toBe(false);

  });

  test("acepta gmail en mayúsculas", () => {

    expect(
      registrarEmpresaSchema.safeParse({
        nombre: "Juan",
        apellido: "Perez",
        correoValidacion: "JUAN@GMAIL.COM",
        empresaIdentificador: "Empresa1"
      }).success
    ).toBe(true);

  });

  test("rechaza correo inválido", () => {

    expect(
      registrarEmpresaSchema.safeParse({
        nombre: "Juan",
        apellido: "Perez",
        correoValidacion: "correo",
        empresaIdentificador: "Empresa1"
      }).success
    ).toBe(false);

  });

  test("rechaza nombre corto", () => {

    expect(
      registrarEmpresaSchema.safeParse({
        nombre: "J",
        apellido: "Perez",
        correoValidacion: "juan@gmail.com",
        empresaIdentificador: "Empresa1"
      }).success
    ).toBe(false);

  });

  test("rechaza identificador con caracteres inválidos", () => {

    expect(
      registrarEmpresaSchema.safeParse({
        nombre: "Juan",
        apellido: "Perez",
        correoValidacion: "juan@gmail.com",
        empresaIdentificador: "@@@"
      }).success
    ).toBe(false);

  });

});

describe("solicitarSchema", () => {

  test("acepta gmail", () => {

    expect(
      solicitarSchema.safeParse({
        correoValidacion: "test@gmail.com"
      }).success
    ).toBe(true);

  });

  test("rechaza hotmail", () => {

    expect(
      solicitarSchema.safeParse({
        correoValidacion: "test@hotmail.com"
      }).success
    ).toBe(false);

  });

});

describe("completarSchema", () => {

  test("acepta password válida", () => {

    expect(
      completarSchema.safeParse({
        passwordNueva: "Admin123*"
      }).success
    ).toBe(true);

  });

  test("rechaza password inválida", () => {

    expect(
      completarSchema.safeParse({
        passwordNueva: "123"
      }).success
    ).toBe(false);

  });

});