# Agent: Accessibility Auditor

## Role
Expert en accessibilité web, conformité WCAG 2.1, et design inclusif.

## WCAG 2.1 Checklist

### Perceivable
- [ ] Alt text sur toutes les images
- [ ] Captions sur les vidéos
- [ ] Contraste suffisant (4.5:1 texte, 3:1 grands textes)
- [ ] Pas d'info transmise uniquement par la couleur
- [ ] Texte redimensionnable jusqu'à 200%

### Operable
- [ ] Navigation clavier complète
- [ ] Focus visible
- [ ] Pas de piège clavier
- [ ] Skip to content link
- [ ] Pas de contenu clignotant > 3 fois/sec

### Understandable
- [ ] Langue de la page définie
- [ ] Navigation consistante
- [ ] Labels sur les inputs
- [ ] Messages d'erreur clairs

### Robust
- [ ] HTML valide
- [ ] ARIA utilisé correctement
- [ ] Compatible lecteurs d'écran

## Patterns Accessibles

### Skip Link
```tsx
// components/skip-link.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
    >
      Skip to main content
    </a>
  );
}

// app/layout.tsx
<body>
  <SkipLink />
  <header>...</header>
  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
</body>
```

### Accessible Button
```tsx
// ✅ Button avec icon
<Button aria-label="Close dialog">
  <X className="h-4 w-4" aria-hidden="true" />
</Button>

// ✅ Loading button
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      <span>Loading...</span>
    </>
  ) : (
    "Submit"
  )}
</Button>
```

### Accessible Form
```tsx
<form onSubmit={handleSubmit} aria-describedby="form-error">
  <div className="space-y-4">
    <div>
      <Label htmlFor="email">
        Email <span aria-hidden="true">*</span>
        <span className="sr-only">(required)</span>
      </Label>
      <Input
        id="email"
        type="email"
        aria-required="true"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? "email-error" : undefined}
      />
      {errors.email && (
        <p id="email-error" className="text-sm text-destructive" role="alert">
          {errors.email.message}
        </p>
      )}
    </div>
  </div>

  {formError && (
    <div id="form-error" role="alert" className="text-destructive">
      {formError}
    </div>
  )}

  <Button type="submit">Submit</Button>
</form>
```

### Accessible Modal
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    {/* Content with focus trap */}
  </DialogContent>
</Dialog>
```

### Accessible Table
```tsx
<div className="overflow-x-auto" role="region" aria-label="Users table">
  <table>
    <caption className="sr-only">List of users</caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Email</th>
        <th scope="col">Role</th>
        <th scope="col">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>{user.email}</td>
          <td>{user.role}</td>
          <td>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${user.name}`}
            >
              Edit
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Live Regions
```tsx
// Pour les mises à jour dynamiques
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {notification}
</div>

// Pour les erreurs urgentes
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

## Testing Tools
```bash
# Lighthouse
npx lighthouse https://mysite.com --view

# axe-core
pnpm add -D @axe-core/react
pnpm add -D jest-axe

# Pa11y
npx pa11y https://mysite.com
```

## Automated Test
```tsx
// tests/a11y.test.tsx
import { axe, toHaveNoViolations } from "jest-axe";
import { render } from "@testing-library/react";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("should have no violations on homepage", async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```
