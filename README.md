# ReDoS Radar

A CLI tool that scans JavaScript npm packages for potentially dangerous regex patterns that could lead to ReDoS (Regular Expression Denial of Service) vulnerabilities.

## Features

- Downloads popular npm packages like `express`, `koa`, `fastify`
- Extracts all regex literals and `new RegExp()` calls from source code
- Saves results in JSON format under `cli/results/`

## Quick Setup

```bash
chmod +x setup.sh
./setup.sh
```
