-- Los nodos autonomos deciden el riego por si mismos y solo reportan su
-- estado via MQTT (topic riegostatus). El backend registra esas transiciones
-- en transicion_afd usando el simbolo 'AUTO_REPORTE', pero ese valor nunca
-- se agrego al enum simbolo_alfabeto, asi que cada INSERT fallaba con
-- "invalid input value for enum simbolo_alfabeto" y abortaba el manejador
-- de riegostatus completo antes de emitir los eventos por WebSocket
-- (estado_riego / transicion_afd) al frontend.
ALTER TYPE simbolo_alfabeto ADD VALUE IF NOT EXISTS 'M_REPORTE_AUTONOMO';
