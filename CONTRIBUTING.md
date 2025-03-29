# Contributing Guidelines

## Code Style

### API Calls
- Use the `api` object from `@/lib/postgrest` for ALL database operations
- All API calls should go through `/api` endpoint which forwards to PostgREST
- Use PostgREST query syntax for filtering and operations:
  - Equality: `?column=eq.value`
  - Like: `?column=ilike.*value*`
  - Greater than: `?column=gt.value`
  - Less than: `?column=lt.value`
  - Multiple filters: `?column1=eq.value1&column2=eq.value2`
- Always include error handling
- Use TypeScript DTOs for request/response types

## Example API Usage
```typescript
// GET with filter
const response = await api.get('/users?role_id=eq.1');

// POST new record
const response = await api.post('/users', userData);

// PATCH/UPDATE
const response = await api.patch(`/users?user_id=eq.${id}`, updateData);

// DELETE
const response = await api.delete(`/users?user_id=eq.${id}`);
```

### Components
- Use functional components with TypeScript
- Follow the component structure in `src/components/ui/example-component.tsx`
- Use constants from `@/lib/styles/constants` for styling
- Use `cn()` utility for className merging

### State Management
- Use Zustand for global state
- Use React Query for server state
- Use local state for component-specific state

### Styling
- Use Tailwind CSS utilities
- Follow the project's color scheme defined in tailwind.config.js
- Use style constants from `@/lib/styles/constants`

## Docker
- Use multi-stage builds
- Follow security best practices
- Include health checks
- Use environment variables for configuration
