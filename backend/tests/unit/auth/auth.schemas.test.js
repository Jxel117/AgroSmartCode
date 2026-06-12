import {
  registroSchema,
  loginSchema
} from "../../../src/modules/auth/auth.schemas.js";

describe("registroSchema", () => {

  test("registro válido", () => {

    const r = registroSchema.safeParse({
      nombre: "Juan",
      apellido: "Perez",
      correoValidacion: "juan@gmail.com",
      contra: "Admin123*",
      rol: "ADMINISTRADOR",
      empresaIdentificador: "Empresa1"
    });

    expect(r.success).toBe(true);

  });

  test("rechaza nombre corto", () => {

    const r = registroSchema.safeParse({
      nombre: "J",
      apellido: "Perez",
      correoValidacion: "juan@gmail.com",
      contra: "Admin123*",
      rol: "ADMINISTRADOR",
      empresaIdentificador: "Empresa1"
    });

    expect(r.success).toBe(false);

  });

  test("rechaza apellido corto", () => {

    const r = registroSchema.safeParse({
      nombre: "Juan",
      apellido: "P",
      correoValidacion: "juan@gmail.com",
      contra: "Admin123*",
      rol: "ADMINISTRADOR",
      empresaIdentificador: "Empresa1"
    });

    expect(r.success).toBe(false);

  });

  test("rechaza correo inválido", () => {

    const r = registroSchema.safeParse({
      nombre: "Juan",
      apellido: "Perez",
      correoValidacion: "correo",
      contra: "Admin123*",
      rol: "ADMINISTRADOR",
      empresaIdentificador: "Empresa1"
    });

    expect(r.success).toBe(false);

  });

  test("rechaza contraseña inválida", () => {

    const r = registroSchema.safeParse({
      nombre: "Juan",
      apellido: "Perez",
      correoValidacion: "juan@gmail.com",
      contra: "123",
      rol: "ADMINISTRADOR",
      empresaIdentificador: "Empresa1"
    });

    expect(r.success).toBe(false);

  });

  test("acepta rol AGRICULTOR", () => {

    const r = registroSchema.safeParse({
      nombre: "Juan",
      apellido: "Perez",
      correoValidacion: "juan@gmail.com",
      contra: "Admin123*",
      rol: "AGRICULTOR",
      empresaIdentificador: "Empresa1"
    });

    expect(r.success).toBe(true);

  });

  test("rechaza rol inválido", () => {

    const r = registroSchema.safeParse({
      nombre: "Juan",
      apellido: "Perez",
      correoValidacion: "juan@gmail.com",
      contra: "Admin123*",
      rol: "HACKER",
      empresaIdentificador: "Empresa1"
    });

    expect(r.success).toBe(false);

  });

  test("asigna ADMINISTRADOR por defecto", () => {

    const r = registroSchema.parse({
      nombre: "Juan",
      apellido: "Perez",
      correoValidacion: "juan@gmail.com",
      contra: "Admin123*",
      empresaIdentificador: "Empresa1"
    });

    expect(r.rol).toBe("ADMINISTRADOR");

  });

});

describe("loginSchema", () => {

  test("login válido", () => {

    const r = loginSchema.safeParse({
      correo: "juan@gmail.com",
      contra: "123456"
    });

    expect(r.success).toBe(true);

  });

  test("correo inválido", () => {

    const r = loginSchema.safeParse({
      correo: "correo",
      contra: "123456"
    });

    expect(r.success).toBe(false);

  });

  test("contraseña vacía", () => {

    const r = loginSchema.safeParse({
      correo: "juan@gmail.com",
      contra: ""
    });

    expect(r.success).toBe(false);

  });

  test("acepta captchaToken", () => {

    const r = loginSchema.safeParse({
      correo: "juan@gmail.com",
      contra: "123456",
      captchaToken: "token123"
    });

    expect(r.success).toBe(true);

  });

  test("acepta ausencia de captchaToken", () => {

    const r = loginSchema.safeParse({
      correo: "juan@gmail.com",
      contra: "123456"
    });

    expect(r.success).toBe(true);

  });

});