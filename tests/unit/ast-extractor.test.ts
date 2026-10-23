import { describe, it, expect } from "vitest";
import { extractSymbolsFromContent } from "@repolens/analysis-adapter";

describe("Analysis Adapter - AST Extraction", () => {
  it("extracts TypeScript functions, classes, and imports", () => {
    const code = `
import { Router } from "express";
import config from "./config";

export function handleUser(id: string) {
  return { id };
}

export class UserService {
  getUser() {}
}

const router = Router();
router.get("/users", handleUser);
`;
    const res = extractSymbolsFromContent("src/users.ts", code);
    expect(res.language).toBe("typescript");
    expect(res.imports).toHaveLength(2);
    expect(res.symbols.some((s) => s.name === "handleUser" && s.kind === "function")).toBe(true);
    expect(res.symbols.some((s) => s.name === "UserService" && s.kind === "class")).toBe(true);
    expect(res.symbols.some((s) => s.name.includes("GET") && s.kind === "endpoint")).toBe(true);
  });

  it("extracts Python functions, classes, and routes", () => {
    const pyCode = `
from fastapi import FastAPI

app = FastAPI()

@app.get("/items")
async def get_items():
    return []

class ItemModel:
    pass
`;
    const res = extractSymbolsFromContent("app/main.py", pyCode);
    expect(res.language).toBe("python");
    expect(res.symbols.some((s) => s.name === "get_items" && s.kind === "function")).toBe(true);
    expect(res.symbols.some((s) => s.name === "ItemModel" && s.kind === "class")).toBe(true);
    expect(res.symbols.some((s) => s.kind === "endpoint")).toBe(true);
  });

  it("extracts Go functions and structs", () => {
    const goCode = `
package main

type Server struct {
  Port int
}

func StartServer(port int) {
}
`;
    const res = extractSymbolsFromContent("server.go", goCode);
    expect(res.language).toBe("go");
    expect(res.symbols.some((s) => s.name === "StartServer" && s.kind === "function")).toBe(true);
    expect(res.symbols.some((s) => s.name === "Server" && s.kind === "class")).toBe(true);
  });
});
