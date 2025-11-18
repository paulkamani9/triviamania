# Triviamania Component Library

This directory contains all shared UI components used throughout the Triviamania application. Components are built with **React**, **TypeScript**, **Framer Motion**, and **Tailwind CSS**.

---

## Architecture

```
components/
├── common/          # Shared UI components
│   ├── Button/
│   ├── Input/
│   ├── Card/
│   ├── Timer/
│   ├── LoadingSpinner/
│   ├── RoomCodeDisplay/
│   └── PlayerCard/
└── motion/          # Animation utilities
    ├── variants.ts
    ├── transitions.ts
    └── useReducedMotion.ts
```

---

## Design Principles

### 1. **Composition Over Configuration**

Components are designed to be composable rather than highly configurable. Use composition to build complex UIs:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Players</CardTitle>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

### 2. **Accessibility First**

All components include:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Reduced motion support via `prefers-reduced-motion`

### 3. **Type Safety**

Every component is fully typed with TypeScript. All props have explicit types, and components export their prop interfaces.

### 4. **Performance**

- Animations use GPU-accelerated properties (`transform`, `opacity`)
- Motion respects user preferences
- Components use `forwardRef` for ref forwarding
- Optimized re-renders with proper memoization

### 5. **Consistent Styling**

- Uses Tailwind CSS utility classes
- CVA (Class Variance Authority) for variant management
- Consistent spacing, colors, and typography

---

## Components

### Button

A versatile button component with multiple variants and sizes.

**Props:**

- `variant`: `'primary'` | `'secondary'` | `'ghost'` | `'danger'` | `'success'`
- `size`: `'sm'` | `'md'` | `'lg'`
- `isLoading`: `boolean` - Shows loading spinner
- All standard button HTML attributes

**Example:**

```tsx
import { Button } from '@/components/common';

<Button variant="primary" size="md" onClick={handleClick}>
  Start Game
</Button>

<Button variant="secondary" isLoading>
  Loading...
</Button>
```

**Accessibility:**

- Respects `prefers-reduced-motion`
- Proper `aria-busy` when loading
- Focus visible styles

---

### Input

A text input field with label, error state, and helper text.

**Props:**

- `label`: `string` - Input label
- `error`: `string` - Error message (automatically styles input)
- `helperText`: `string` - Helper text below input
- `variant`: `'default'` | `'error'`
- All standard input HTML attributes

**Example:**

```tsx
import { Input } from '@/components/common';

<Input
  id="playerName"
  label="Player Name"
  placeholder="Enter your name"
  error={errors.name}
  required
/>;
```

**Accessibility:**

- Automatic ID generation
- `aria-invalid` for error states
- `aria-describedby` for errors/helper text
- Required indicator (\*)

---

### Card

A container component for grouping related content.

**Subcomponents:**

- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title heading
- `CardContent` - Content section

**Example:**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common';

<Card>
  <CardHeader>
    <CardTitle>Room Lobby</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Waiting for players...</p>
  </CardContent>
</Card>;
```

**Features:**

- Animates on mount with fade-in
- Fully customizable with className
- Supports all motion props

---

### Timer

A visual countdown timer with circular progress indicator.

**Props:**

- `duration`: `number` - Duration in seconds
- `onComplete`: `() => void` - Callback when timer reaches 0
- `autoStart`: `boolean` - Start immediately
- `size`: `'sm'` | `'md'` | `'lg'`
- `showProgress`: `boolean` - Show progress circle

**Example:**

```tsx
import { Timer } from '@/components/common';

<Timer duration={10} onComplete={handleTimerComplete} autoStart size="md" />;
```

**Hook:**

```tsx
import { useTimer } from '@/components/common';

const { timeLeft, isRunning, start, pause, reset } = useTimer({
  duration: 10,
  onComplete: () => console.log('Done!'),
});
```

**Accessibility:**

- `role="timer"`
- `aria-live="polite"` for screen readers
- Color changes based on time remaining

---

### LoadingSpinner

A simple loading spinner with multiple sizes.

**Props:**

- `size`: `'sm'` | `'md'` | `'lg'`
- `className`: `string`

**Example:**

```tsx
import { LoadingSpinner } from '@/components/common';

<LoadingSpinner size="md" />;
```

**Accessibility:**

- Shows static spinner when `prefers-reduced-motion`
- `role="status"`
- `aria-label="Loading"`
- Screen reader text

---

### RoomCodeDisplay

Displays a room code with copy-to-clipboard functionality.

**Props:**

- `code`: `string` - Room code to display
- `onCopy`: `() => void` - Callback after successful copy

**Example:**

```tsx
import { RoomCodeDisplay } from '@/components/common';

<RoomCodeDisplay
  code="ABCD1234"
  onCopy={() => toast.success('Code copied!')}
/>;
```

**Features:**

- Visual feedback on copy
- Hover animation
- Error handling for clipboard API

---

### PlayerCard

Displays player information in a card format.

**Props:**

- `player`: `Player` - Player object from types
- `rank`: `number` - Optional rank position
- `showScore`: `boolean` - Show/hide score

**Example:**

```tsx
import { PlayerCard } from '@/components/common';

<PlayerCard player={player} rank={1} showScore={true} />;
```

**Features:**

- Shows host badge for host players
- Rank badge with color coding (1st, 2nd, 3rd)
- Layout animations for reordering
- Unique `layoutId` for smooth transitions

---

## Motion System

### Variants

Pre-defined motion variants for consistent animations:

```tsx
import { fadeIn, slideUp, scaleIn, bounceIn } from '@/components/motion';

<motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
  Content
</motion.div>;
```

**Available variants:**

- `fadeIn` - Fade in/out
- `slideUp` - Slide up from bottom
- `slideDown` - Slide down from top
- `scaleIn` - Scale in/out
- `bounceIn` - Bounce in with spring
- `staggerContainer` - Stagger children
- `staggerItem` - Item in staggered list

### Transitions

Pre-defined timing configurations:

```tsx
import { quick, standard, smooth, spring } from '@/components/motion';

<motion.div transition={standard}>Content</motion.div>;
```

**Available transitions:**

- `quick` - 150ms (micro-interactions)
- `standard` - 200ms (most UI)
- `smooth` - 300ms (larger movements)
- `spring` - Physics-based spring
- `gentleSpring` - Subtle spring
- `bouncySpring` - Playful spring

### useReducedMotion Hook

Detects user's motion preferences:

```tsx
import { useReducedMotion } from '@/components/motion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div animate={prefersReducedMotion ? {} : { scale: 1.2 }}>
      Content
    </motion.div>
  );
}
```

---

## Testing

All components should have accompanying test files:

```tsx
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './index';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button isLoading>Click</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

---

## Usage Guidelines

### Importing Components

Always import from the index file:

```tsx
// ✅ Good
import { Button, Input, Card } from '@/components/common';

// ❌ Bad
import { Button } from '@/components/common/Button';
```

### Customizing Styles

Use the `className` prop to add custom styles:

```tsx
<Button className="mt-4 w-full">Full Width Button</Button>
```

### Forwarding Refs

All components support ref forwarding:

```tsx
const inputRef = useRef<HTMLInputElement>(null);

<Input ref={inputRef} label="Name" />;
```

### Animation Guidelines

1. **Keep it subtle**: Animations should enhance, not distract
2. **Respect timing**: < 500ms for micro-interactions
3. **Use GPU properties**: Prefer `transform` and `opacity`
4. **Test reduced motion**: Always check with `prefers-reduced-motion`
5. **Provide feedback**: Visual feedback for user actions

---

## Best Practices

### Component Creation

When creating new components:

1. **Create directory structure**: `ComponentName/index.tsx`
2. **Add TypeScript types**: Export prop interfaces
3. **Include accessibility**: ARIA, keyboard support
4. **Add documentation**: JSDoc comments
5. **Write tests**: Cover all use cases
6. **Export from index**: Add to `/components/common/index.ts`

### Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus management is clear
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion is respected
- [ ] ARIA attributes are correct
- [ ] Error states are announced

### Performance Checklist

- [ ] Animations use `transform`/`opacity`
- [ ] Components use `forwardRef`
- [ ] No unnecessary re-renders
- [ ] Large lists use virtualization
- [ ] Images are optimized
- [ ] Bundle size is reasonable

---

## Future Enhancements

Planned components for future phases:

- **Badge** - Status indicators
- **Toast** - Notification system
- **Modal** - Dialog overlays
- **Dropdown** - Select menus
- **Avatar** - Player avatars
- **Progress** - Progress bars
- **Tooltip** - Hover information
- **Tabs** - Tab navigation

---

## Contributing

When adding new components:

1. Follow existing patterns and conventions
2. Add comprehensive TypeScript types
3. Include accessibility features
4. Write tests with good coverage
5. Document usage in this README
6. Get review before merging

---

**Last Updated**: November 18, 2025  
**Maintainer**: Triviamania Development Team
