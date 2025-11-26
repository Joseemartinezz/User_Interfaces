# Documentation - AAC App

This folder contains all project documentation, configuration guides, and AI behavior configuration.

## Structure

```
docs/
├── .cursorrules                    # AI behavior configuration for Cursor IDE
├── architecture.mermaid            # System architecture diagram
├── technical.md                    # Technical documentation and specifications
├── status.md                       # Project progress tracking
├── project-brief.md                # Project brief and overview
├── arasaac-integration-summary.md  # ARASAAC integration summary
├── configuration/                   # Configuration guides
│   ├── README.md                   # Configuration guides index
│   ├── api-setup.md                # AI APIs setup (Gemini, OpenAI)
│   ├── arasaac-setup.md            # ARASAAC pictogram integration
│   ├── arasaac-quickstart.md       # ARASAAC quick start guide
│   ├── arasaac-quick-commands.md   # ARASAAC quick commands reference
│   ├── openai-setup.md             # OpenAI API setup guide
│   ├── pictograms-reference.md     # Pictograms reference and IDs
│   ├── env-config.md               # Environment variables configuration
│   └── platform-setup.md           # Platform-specific setup (iOS, Android, Web)
├── development/                     # Development documentation
│   └── parent-menu-changes.md      # Parent menu implementation changes
└── README.md                       # This file
```

## Quick Links

### Core Documentation
- [Architecture](./architecture.mermaid) - System architecture diagram
- [Technical Documentation](./technical.md) - Technical specifications
- [Project Status](./status.md) - Current progress and tasks

### Configuration Guides
- [API Setup](./configuration/api-setup.md) - Configure Gemini and OpenAI APIs
- [OpenAI Setup](./configuration/openai-setup.md) - OpenAI API specific guide
- [ARASAAC Setup](./configuration/arasaac-setup.md) - Pictogram integration guide
- [ARASAAC Quickstart](./configuration/arasaac-quickstart.md) - Quick start guide
- [ARASAAC Quick Commands](./configuration/arasaac-quick-commands.md) - Command reference
- [Pictograms Reference](./configuration/pictograms-reference.md) - Pictogram IDs and usage
- [Environment Variables](./configuration/env-config.md) - Environment configuration
- [Platform Setup](./configuration/platform-setup.md) - Platform-specific setup

### Project Documentation
- [Project Brief](./project-brief.md) - Project overview and roadmap
- [ARASAAC Integration Summary](./arasaac-integration-summary.md) - Integration details

### Development Documentation
- [Parent Menu Changes](./development/parent-menu-changes.md) - UI/UX changes documentation

### AI Configuration
- [.cursorrules](./.cursorrules) - AI behavior configuration for Cursor IDE

## Documentation Purpose

### Architecture
The `architecture.mermaid` file contains a visual representation of the system architecture, showing:
- Frontend layer (React Native/Expo)
- API Gateway layer (Express.js)
- Services layer (AI and ARASAAC services)
- External integrations
- Data flow

### Technical Documentation
The `technical.md` file contains:
- System overview
- Architecture details
- Data flow descriptions
- AI integration patterns
- Type definitions
- Error handling strategies
- Performance considerations

### Status Tracking
The `status.md` file tracks:
- Completed features
- In-progress work
- Planned features
- Known issues
- Technical debt
- Recent changes

### Configuration Guides
The `configuration/` folder contains detailed guides for:
- Setting up AI APIs (Gemini, OpenAI)
- Integrating ARASAAC pictograms
- Configuring environment variables
- Platform-specific setup instructions

## For Developers

When working on this project:

1. **Read the architecture** (`architecture.mermaid`) to understand system design
2. **Check the status** (`status.md`) for current tasks and progress
3. **Follow technical specs** (`technical.md`) for implementation guidelines
4. **Use configuration guides** when setting up the development environment
5. **Update status.md** when completing tasks or encountering issues

## For AI Assistants

The `.cursorrules` file contains comprehensive guidelines for AI assistants working on this project, including:
- Project structure and context
- Code style and patterns
- Technology stack requirements
- Architecture understanding rules
- Task management workflow
- Integration guidelines

AI assistants should read `.cursorrules` first to understand project requirements and constraints.

## Contributing

When adding new documentation:

1. Place configuration guides in `configuration/`
2. Update this README if adding new sections
3. Keep documentation up-to-date with code changes
4. Follow markdown formatting standards
5. Include code examples where helpful

## Notes

- All documentation is in Markdown format
- Architecture diagram uses Mermaid syntax
- Configuration guides include platform-specific instructions
- Status file should be updated regularly to reflect current state

