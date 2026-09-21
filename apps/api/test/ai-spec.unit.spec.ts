import { AppSpecSchema } from "../src/modules/ai/schemas/app-spec.schema";

describe("AppSpecSchema", () => {
  it("accepts a valid, minimal generated spec", () => {
    const result = AppSpecSchema.safeParse({
      summary: "Inventory dashboard with stock cards and a reorder table.",
      pages: [{ route: "/", title: "Dashboard", components: ["StatGrid"] }],
      components: [{ name: "StatGrid", path: "components/StatGrid.tsx", description: "KPI cards." }],
      dataModels: [
        {
          name: "InventoryItem",
          fields: [
            { name: "id", type: "string", required: true },
            { name: "onHand", type: "number", required: true },
          ],
        },
      ],
      files: [{ path: "app/page.tsx", language: "typescript", content: "export default function Page() {}" }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a spec with no files", () => {
    const result = AppSpecSchema.safeParse({
      summary: "Nothing generated.",
      pages: [{ route: "/", title: "Home", components: [] }],
      components: [],
      dataModels: [],
      files: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a spec missing required top-level fields", () => {
    const result = AppSpecSchema.safeParse({ summary: "Incomplete" });
    expect(result.success).toBe(false);
  });
});
