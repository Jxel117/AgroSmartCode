import { jest } from '@jest/globals';

// -------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE MOCKS DE INFRAESTRUCTURA (ESM)
// -------------------------------------------------------------------------
const mockQuery = jest.fn();
const mockWithTransaction = jest.fn();

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: mockQuery,
  withTransaction: mockWithTransaction
}));

// Importación dinámica del SUT (System Under Test) post-mockeo
const { findOrCreateByParcela, aplicarTransicion, findTransiciones } = 
  await import("../../../src/modules/afd/afd.repository.js");

// -------------------------------------------------------------------------
// 2. FACTORÍAS DE DATOS DE PRUEBA (Fixtures / Mocks)
// -------------------------------------------------------------------------
const createAfdFixture = (overrides = {}) => ({
  id_afd: 1,
  parcela_id: 'PARCELA-TEST-01',
  estado_actual: 'INICIAL',
  contador_intentos_fallidos: 0,
  n_intentos_fallidos_max: 3,
  fecha_ultimo_cambio_estado: new Date().toISOString(),
  ...overrides
});

const createTransicionFixture = (overrides = {}) => ({
  estadoOrigen: 'INICIAL',
  estadoDestino: 'PROCESANDO',
  contadorIntentos: 1,
  simbolo: 'SIGMA',
  humedad: 65.4,
  temperatura: 24.2,
  causa: 'Lectura de sensor válida',
  ...overrides
});

// -------------------------------------------------------------------------
// 3. SUITE DE PRUEBAS UNITARIAS (CAJA BLANCA)
// -------------------------------------------------------------------------
describe('Automated Finite Automaton (AFD) Repository - White-Box Test Suite', () => {
  
  beforeEach(() => {
    jest.resetAllMocks(); // Resetea comportamiento y estados por completo
  });

  describe('findOrCreateByParcela()', () => {
    const TARGET_PARCELA = 'PARCELA-01';

    test('should return existing record and bypass insertion when record exists (Branch: Match found)', async () => {
      // Arrange
      const existingAfd = createAfdFixture({ parcela_id: TARGET_PARCELA });
      mockQuery.mockResolvedValueOnce({ rows: [existingAfd] });

      // Act
      const result = await findOrCreateByParcela(TARGET_PARCELA);

      // Assert (Control de flujo exhaustivo)
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [TARGET_PARCELA]
      );
      expect(result).toEqual(existingAfd);
    });

    test('should execute full sequence (SELECT empty -> INSERT) and return new record when not found (Branch: Cache miss)', async () => {
      // Arrange
      const newAfd = createAfdFixture({ parcela_id: TARGET_PARCELA, n_intentos_fallidos_max: 5 });
      mockQuery
        .mockResolvedValueOnce({ rows: [] })         // Resultado de la consulta inicial
        .mockResolvedValueOnce({ rows: [newAfd] });   // Resultado del bloque de inserción

      // Act
      const result = await findOrCreateByParcela(TARGET_PARCELA, 5);

      // Assert
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT'), [TARGET_PARCELA]);
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT'), [TARGET_PARCELA, 5]);
      expect(result).toEqual(newAfd);
    });
  });

  describe('aplicarTransicion()', () => {
    
    test('should orchestrate atomic execution of UPDATE and INSERT queries within a transaction', async () => {
      // Arrange
      const mockClient = { query: jest.fn().mockResolvedValue({ rows: [] }) };
      
      // Inyección del cliente simulado en la callback transaccional
      mockWithTransaction.mockImplementationOnce(async (transactionCallback) => {
        return transactionCallback(mockClient);
      });

      const afdInstance = createAfdFixture({ id_afd: 42 });
      const transitionData = createTransicionFixture({ estadoDestino: 'ALERTA', contadorIntentos: 2 });

      // Act
      await aplicarTransicion(afdInstance, transitionData);

      // Assert
      expect(mockWithTransaction).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(2);

      // Inspección milimétrica de las queries de la transacción (Caja Blanca)
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('UPDATE afd_instancia SET'),
        [42, 'ALERTA', 2]
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('INSERT INTO transicion_afd'),
        [42, 'INICIAL', 'ALERTA', 'SIGMA', 65.4, 24.2, 'Lectura de sensor válida']
      );
    });

    test('should bubble up database errors and halt execution if the transaction block fails', async () => {
      // Arrange: Simulamos que la BD explota en la segunda consulta
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // El UPDATE pasa
          .mockRejectedValueOnce(new Error('DB Deadlock Detected')) // El INSERT falla
      };
      
      mockWithTransaction.mockImplementationOnce(async (callback) => callback(mockClient));

      // Act & Assert
      await expect(aplicarTransicion(createAfdFixture(), createTransicionFixture()))
        .rejects
        .toThrow('DB Deadlock Detected');
    });
  });

  describe('findTransiciones()', () => {
    const PARCELA_ID = 'PARCELA-ABC';

    test('should apply default pagination limit of 50 records when not provided', async () => {
      // Arrange
      const mockRows = [createTransicionFixture(), createTransicionFixture()];
      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      // Act
      const result = await findTransiciones(PARCELA_ID);

      // Assert
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.id_transicion'),
        [PARCELA_ID, 50] // Verifica que se respeta la constante por defecto del negocio
      );
      expect(result).toHaveLength(2);
    });

    test('should override query boundaries when custom limit is passed', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Act
      await findTransiciones(PARCELA_ID, 15);

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(
        expect.not.stringContaining('LIMIT 50'), 
        [PARCELA_ID, 15]
      );
    });
  });

});