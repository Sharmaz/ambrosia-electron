# Mi Presentación

Una presentación de ejemplo con reveal.js

---

## Características

- Markdown para escribir slides
- Syntax highlighting para código
- Diagramas Mermaid
- Navegación con teclado

--

### Navegación Vertical

Usa las flechas ↑ y ↓ para slides verticales

---

## Ejemplo de Código

```javascript
function saludar(nombre) {
  console.log(`¡Hola, ${nombre}!`);
}

saludar('Mundo');
```

---

## Ejemplo de Código Python

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

---

## Diagrama de Flujo

<div class="mermaid">
flowchart LR
    A[Inicio] --> B{Decisión}
    B -->|Sí| C[Acción 1]
    B -->|No| D[Acción 2]
    C --> E[Fin]
    D --> E
</div>

---

## Diagrama de Proceso

<div class="mermaid">
flowchart TD
    A[Inicio] -->|Paso 1| B(Procesamiento)
    B --> C{¿Válido?}
    C -->|Sí| D[Guardar]
    C -->|No| E[Error]
    D --> F[Fin]
    E --> F
</div>

---

## Diagrama de Secuencia

<div class="mermaid">
sequenceDiagram
    participant U as Usuario
    participant A as API
    participant D as Database
    U->>A: Solicitud
    A->>D: Consulta
    D-->>A: Datos
    A-->>U: Respuesta
</div>

---

## ¡Gracias!

Presiona 'H' para ver los atajos de teclado

- Flechas: Navegar
- F: Pantalla completa
- O/ESC: Vista general
- Alt+Click: Zoom
