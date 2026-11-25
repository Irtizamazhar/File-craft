/**
 * One-step tool workspace switch (upload, process and download inside one box, no scrolling).
 *  - Build with NEXT_PUBLIC_ONE_STEP_WORKSPACE=off to return every tool to the previous layout.
 *  - Remove a slug from WORKSPACE_TOOLS to return just that tool to the previous layout.
 * The previous layouts (components/ToolProcessor.tsx and the classic advanced tool layouts) stay in the code base
 * as the fallback, so switching back needs no other change.
 */
export const WORKSPACE_TOOLS:readonly string[]=['merge-pdf','remove-background','split-pdf','compress-pdf','rotate-pdf','extract-pdf-pages','delete-pdf-pages','add-page-numbers','watermark-pdf','crop-pdf','grayscale-pdf'];

export function usesWorkspace(slug:string){
  return process.env.NEXT_PUBLIC_ONE_STEP_WORKSPACE!=='off'&&WORKSPACE_TOOLS.includes(slug);
}
