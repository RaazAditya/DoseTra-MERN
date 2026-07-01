import mongoose from "mongoose";

const medicineKnowledgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true, default: "" },
    brandNames: { type: [String], default: [] },
    aliases: { type: [String], default: [] },
    category: { type: String, default: "" },
    drugClass: { type: String, default: "" },
    uses: { type: String, default: "" },
    mechanism: { type: String, default: "" },
    dosage: { type: String, default: "" },
    forms: { type: [String], default: [] },
    sideEffects: { type: String, default: "" },
    interactions: { type: String, default: "" },
    contraindications: { type: String, default: "" },
    warnings: { type: String, default: "" },
    foodInstructions: { type: String, default: "" },
    storage: { type: String, default: "" },
    pregnancyCategory: { type: String, default: "" },
    searchText: { type: String, default: "" },
  },
  { timestamps: true }
);

medicineKnowledgeSchema.index({ name: 1 });
medicineKnowledgeSchema.index({ genericName: 1 });
medicineKnowledgeSchema.index({ aliases: 1 });
medicineKnowledgeSchema.index({ searchText: "text", name: "text", genericName: "text" });

export default mongoose.model("MedicineKnowledge", medicineKnowledgeSchema);
