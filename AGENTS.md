<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Frontend only; booking data comes through `src/services/bookingService.ts`, which picks the in-memory mock (`src/mocks/`) or HTTP client by `VITE_API_MODE`. Why: the Java backend is built separately and must be swappable.
- All HTTP and error mapping lives in `src/services/apiClient.ts`; components never call fetch. Why: auth can be added in one place later.
- No localStorage/sessionStorage persistence and no secrets in `VITE_` vars. Why: assessment requirements.
