import { api } from "./apiService";

import { API_ENDPOINTS } from "@/config";

// Backend expects snake_case, frontend uses camelCase. Map as needed.

export const bugService = {

    async uploadBugAttachmentForm(bugId: string, file: File, title?: string, isInline?: boolean) {
        const form = new FormData();
        // form.append("project_id", projectId);
        form.append("bug_id", bugId);
        if (title) form.append("title", title);
        form.append("file", file);
        form.append("is_inline", isInline ? "true" : "false");
        // IMPORTANT: let fetch set multipart headers; don't set Content-Type manually
        return api.post(`${API_ENDPOINTS.BUGS}/${bugId}/attachments`, form);
    },

    async deleteBugAttachment(attachmentId: string, bugId: string) {
        return api.del(`${API_ENDPOINTS.BUGS}/${bugId}/attachments/${attachmentId}`, {});
    },

    // ----------------- Dependencies -----------------
    async addDependency(bugId: string, bodyParams: any) {
        try {
            return await api.post(`${API_ENDPOINTS.BUGS}/${bugId}/dependencies`, bodyParams);
        } catch (e: any) {
            // Fallback when the endpoint isn't available yet (optional)
            throw e;
        }
    },
    async removeDependency(bugId: string, dependencyId: string) {
        try {
            return await api.del(`${API_ENDPOINTS.BUGS}/${bugId}/dependencies/${dependencyId}`, {});
        } catch (e: any) {
            throw e;
        }
    },

};
