import { defineStore } from "pinia";
import {
  createPolicyDocument,
  deletePolicyDocument,
  listPolicyDocument,
  updatePolicyDocument
} from "../api/PolicyDocument";
import {
  bulkCreatePolicySection,
  deletePolicySectionByDocument,
  listPolicySection
} from "../api/PolicySection";
import { deleteDiffResultByDocument, listDiffResult } from "../api/DiffResult";
import { deleteReviewNoteByDiffIds, listReviewNote } from "../api/ReviewNote";
import type { PolicyDocument } from "../types/PolicyDocument";
import type { ParsedSectionDraft } from "../hooks/usePolicyParser";
import { createPolicyDocumentResponse } from "../constructors/PolicyDocumentConstructor";
import { createPolicySectionFromDraft } from "../constructors/PolicySectionConstructor";
import { ERROR_CODES } from "../constants/errorCodes";
import { PolicyDiffError } from "../utils/errors";
import { logAction } from "../utils/logger";

export interface ImportPolicyInput {
  title: string;
  versionLabel: string;
  rawText: string;
  drafts: ParsedSectionDraft[];
}

export const usePolicyDocumentStore = defineStore("policyDocument", {
  state: () => ({
    rows: [] as PolicyDocument[],
    sections: [] as Awaited<ReturnType<typeof listPolicySection>>,
    loading: false,
    importing: false
  }),
  getters: {
    sortedByImported: (state) =>
      [...state.rows].sort((a, b) => a.imported_at.localeCompare(b.imported_at)),
    getById: (state) => (id: number | null) => state.rows.find((row) => row.id === id) ?? null
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        const [documents, sections] = await Promise.all([listPolicyDocument(), listPolicySection()]);
        this.rows = documents;
        this.sections = sections;
      } finally {
        this.loading = false;
      }
    },
    sectionsOf(documentId: number) {
      return this.sections
        .filter((section) => section.document_id === documentId)
        .sort((a, b) => a.section_no.localeCompare(b.section_no, "zh-CN-u-kn-true"));
    },
    async importPolicy(input: ImportPolicyInput): Promise<PolicyDocument> {
      if (!input.rawText.trim()) {
        throw new PolicyDiffError(ERROR_CODES.EMPTY_POLICY_TEXT);
      }
      if (!input.versionLabel.trim()) {
        throw new PolicyDiffError(ERROR_CODES.MISSING_VERSION_LABEL);
      }
      this.importing = true;
      try {
        const document = await createPolicyDocument(
          createPolicyDocumentResponse({
            title: input.title.trim() || "未命名隐私政策",
            version_label: input.versionLabel.trim(),
            raw_text: input.rawText,
            normalized_sections: JSON.stringify(input.drafts.map((draft) => draft.match_key))
          }, 0)
        );
        const created = await bulkCreatePolicySection(
          input.drafts.map((draft) => createPolicySectionFromDraft(draft, 0, document.id))
        );
        this.rows.push(document);
        this.sections.push(...created);
        logAction("PolicyDocument", "IMPORT", {
          id: document.id,
          title: document.title,
          sectionCount: created.length
        });
        return document;
      } finally {
        this.importing = false;
      }
    },
    async updateDocument(payload: PolicyDocument) {
      const updated = await updatePolicyDocument(payload);
      const index = this.rows.findIndex((row) => row.id === updated.id);
      if (index >= 0) this.rows[index] = updated;
      logAction("PolicyDocument", "UPDATE", { id: updated.id, title: updated.title });
      return updated;
    },
    async removeDocument(id: number) {
      const document = this.rows.find((row) => row.id === id);
      if (!document) throw new PolicyDiffError(ERROR_CODES.DOCUMENT_NOT_FOUND, { id });
      const [diffs, notes] = await Promise.all([listDiffResult(), listReviewNote()]);
      const relatedDiffIds = diffs
        .filter((diff) => diff.old_document_id === id || diff.new_document_id === id)
        .map((diff) => diff.id);
      await Promise.all([
        deletePolicySectionByDocument(id),
        deleteDiffResultByDocument(id),
        deleteReviewNoteByDiffIds(relatedDiffIds),
        deletePolicyDocument(id)
      ]);
      this.rows = this.rows.filter((row) => row.id !== id);
      this.sections = this.sections.filter((section) => section.document_id !== id);
      logAction("PolicyDocument", "DELETE", { id, title: document.title });
    }
  }
});
