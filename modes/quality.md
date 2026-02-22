# Mode: Quality

## Description
Mode focalisé sur la qualité maximale et la robustesse.

## Comportement
```yaml
verbosity: high
testing: comprehensive
documentation: complete
error_handling: exhaustive
edge_cases: all_covered
code_review: self_review
security: thorough_check
performance: optimized
```

## Quand l'utiliser
- Code de production critique
- Systèmes financiers
- APIs publiques
- Librairies partagées
- Avant release majeure

## Caractéristiques
- Tests exhaustifs (unit, integration, e2e)
- Documentation complète
- Gestion d'erreurs robuste
- Validation stricte
- Sécurité vérifiée
- Performance optimisée

## Format de sortie

### Code avec qualité maximale
```typescript
/**
 * Creates a new user account with validation and security measures.
 *
 * @param input - The user creation data
 * @returns The created user (without password)
 * @throws {ValidationError} If input validation fails
 * @throws {ConflictError} If email already exists
 * @throws {DatabaseError} If database operation fails
 *
 * @example
 * ```ts
 * const user = await createUser({
 *   email: 'user@example.com',
 *   password: 'securePassword123!',
 *   name: 'John Doe'
 * });
 * ```
 */
export async function createUser(input: CreateUserInput): Promise<UserDTO> {
  // Validate input
  const validatedInput = createUserSchema.parse(input);

  // Check for existing user
  const existingUser = await db.user.findUnique({
    where: { email: validatedInput.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password with secure algorithm
  const hashedPassword = await argon2.hash(validatedInput.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Create user in transaction
  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: validatedInput.email.toLowerCase(),
        password: hashedPassword,
        name: validatedInput.name,
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: newUser.id,
        metadata: { email: newUser.email },
      },
    });

    return newUser;
  });

  // Return sanitized user (no password)
  return sanitizeUser(user);
}
```

### Tests complets
```typescript
describe('createUser', () => {
  it('creates a user with valid input', async () => {
    const input = { email: 'test@example.com', password: 'Secure123!', name: 'Test' };
    const result = await createUser(input);

    expect(result).toMatchObject({
      email: 'test@example.com',
      name: 'Test',
    });
    expect(result).not.toHaveProperty('password');
  });

  it('normalizes email to lowercase', async () => {
    const result = await createUser({ email: 'TEST@Example.COM', password: 'Secure123!', name: 'Test' });
    expect(result.email).toBe('test@example.com');
  });

  it('throws ConflictError for duplicate email', async () => {
    await createUser({ email: 'dup@test.com', password: 'Secure123!', name: 'First' });
    await expect(createUser({ email: 'dup@test.com', password: 'Secure123!', name: 'Second' }))
      .rejects.toThrow(ConflictError);
  });

  it('throws ValidationError for weak password', async () => {
    await expect(createUser({ email: 'test@test.com', password: '123', name: 'Test' }))
      .rejects.toThrow(ValidationError);
  });

  it('creates audit log entry', async () => {
    const result = await createUser({ email: 'audit@test.com', password: 'Secure123!', name: 'Audit' });
    const log = await db.auditLog.findFirst({ where: { entityId: result.id } });

    expect(log).toMatchObject({
      action: 'USER_CREATED',
      entityType: 'USER',
    });
  });
});
```

## Checklist Qualité
- [ ] Types stricts (no any)
- [ ] Validation des entrées
- [ ] Gestion d'erreurs complète
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Documentation JSDoc
- [ ] Sécurité vérifiée
- [ ] Performance mesurée
- [ ] Edge cases couverts
- [ ] Code review effectuée
