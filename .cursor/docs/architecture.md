# Content Studio Architecture

## Overview

Enonic XP Content Studio is a comprehensive content management application built as a Gradle multiproject that combines modern frontend technologies with Java backend services for integration with Enonic XP. The application provides a sophisticated UI for content creation, editing, and management within the Enonic XP platform ecosystem.

## Core Architecture

### Project Structure

The application is organized as a Gradle multiproject with four distinct modules:

- **`app`** - Main Content Studio UI application (Preact/TypeScript frontend)
- **`lib`** - Shared component library and utilities (Reusable UI components)
- **`rest`** - Backend REST API services (Java/Spring-based)
- **`testing`** - End-to-end testing suite (WebDriver-based)

### Technology Stack

- **Frontend**: Preact 10, TypeScript, Webpack, Vite, Tailwind CSS v4, legacy elements from lib-admin-ui, legacy Less styling
- **Backend**: Java 21, JAX-RS, OSGi services
- **Build System**: Gradle with pnpm workspaces
- **Package Manager**: pnpm
- **Testing**: WebDriver, Jest, Mockito
- **Code Quality**: ESLint, TypeScript strict mode

## Module Architecture

### Frontend Application (`app`)

The main application module contains the Content Studio UI built with modern web technologies:

**Entry Point**: `main.ts` - Initializes the application, handles routing, and manages the main UI lifecycle.

**Key Features**:
- Preact-based component architecture
- TypeScript for type safety
- Webpack for bundling and asset management
- Integration with Enonic XP's lib-admin-ui framework
- Dynamic content loading and widget management

**Build Process**:
- TypeScript compilation to ES5
- Webpack bundling with SWC loader
- CSS processing with Less and PostCSS
- Asset optimization and minification

### Component Library (`lib`)

The shared library provides reusable UI components and utilities:

**Component Organization**:
- `ui2/` - Modern React-like components using Preact with Tailwind CSS v4
- `app/` - Business logic and domain models
- `styles/` - Legacy Less/CSS styling and themes

**Styling System**:
- Tailwind CSS v4 for utility-first styling
- Vite for CSS bundling and optimization
- Design token system for consistent theming
- Less for legacy component styling

**Build Process**:
- Dual build system: Webpack (legacy) + Vite (modern)
- TypeScript compilation with declaration files
- CSS processing with PostCSS and Tailwind
- Asset bundling and optimization

### REST API Services (`rest`)

The backend module provides RESTful APIs for the frontend:

**Architecture**:
- JAX-RS-based REST endpoints
- OSGi service components
- Role-based security with `@RolesAllowed`
- JSON serialization for API responses

**Key Resources**:
- `ProjectResource` - Project management operations
- `ContentResource` - Content CRUD operations
- `ArchiveResource` - Content archiving/restoration
- `TaskResource` - Background task management
- `ApplicationResource` - Application metadata

**API Structure**:
- RESTful endpoints under `/admin/rest-v2/cs/`
- JSON request/response format
- Error handling with HTTP status codes
- Task-based operations for long-running processes

### Testing Module (`testing`)

Comprehensive testing infrastructure:

**Test Types**:
- End-to-end tests with WebDriver
- Page object pattern for maintainable tests
- Integration tests for API endpoints
- Unit tests for business logic

**Test Organization**:
- `page_objects/` - Reusable page components
- `specs/` - Test specifications
- `libs/` - Test utilities and helpers

## Build System Architecture

### Gradle Configuration

**Root Build**:
- Multi-project configuration
- Shared dependencies and plugins
- Environment-specific builds (dev/prod)
- Java 21 toolchain configuration

**Module Builds**:
- `app`: Frontend bundling with Webpack
- `lib`: Component library compilation
- `rest`: Java compilation and JAR packaging
- `testing`: Test execution and reporting

### pnpm Workspace

**Workspace Structure**:
- Monorepo with pnpm workspaces
- Shared dependencies across modules
- Version management and lock files
- Development and production builds

**Build Scripts**:
- `pnpm build` - Module builds
- `pnpm check` - Code quality checks
- `pnpm test` - Test execution

## Data Flow Architecture

### Frontend-Backend Communication

1. **API Calls**: Frontend makes REST API calls to backend services
2. **Data Serialization**: JSON format for request/response
3. **Error Handling**: Centralized error management
4. **State Management**: Component-level state with event-driven updates

### Component Architecture

**Legacy Integration**:
- `LegacyElement` wrapper for modern Preact components to work inside legacy lib-admin-ui framework
- Integration with existing lib-admin-ui framework
- Event-driven communication between components

**Modern Components**:
- Functional components with hooks
- TypeScript interfaces for props
- Reusable UI components from `@enonic/ui`

## Security Architecture

### Authentication & Authorization

- **Authentication**: Enonic XP's built-in auth system
- **Authorization**: Role-based access control
- **API Security**: `@RolesAllowed` annotations on REST endpoints
- **Content Security**: Project-based access control

### Data Protection

- **Input Validation**: Server-side validation for all inputs
- **XSS Prevention**: Content sanitization and CSP headers
- **CSRF Protection**: Token-based request validation

## Development Workflow

### Code Organization

- **TypeScript**: Strict mode with comprehensive type checking
- **ESLint**: Code quality and style enforcement
- **Prettier**: Code formatting consistency

### Build Pipeline

1. **Dependency Installation**: pnpm install
2. **Type Checking**: TypeScript compilation
3. **Linting**: ESLint validation
4. **Testing**: Unit and integration tests
5. **Building**: Webpack/Vite compilation
6. **Packaging**: JAR file creation

## Deployment Architecture

### Build Artifacts

- **Frontend**: Compiled JavaScript, CSS, and assets
- **Backend**: JAR files with REST services
- **Library**: Reusable component library
- **Assets**: Images, fonts, and static resources

### Environment Configuration

- **Development**: Source maps, unminified code
- **Production**: Optimized, minified bundles
- **CI/CD**: Automated testing and deployment

## Future Enhancements

### Planned Improvements

- **React Components**: Slow migration from self-written classes as wrappers around actual DOM elements to Preact/React components using Enonic UI library.
