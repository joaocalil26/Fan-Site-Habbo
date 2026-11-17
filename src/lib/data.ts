export {
  getNewsFeedCursor as fetchNewsPage,
  getRecentEmblemsCursor as fetchEmblemsPage,
} from "./queries";
import { getForumThreadsCursor } from "./queries";
export function fetchThreadsPage(opts: {
  cursor?: string | null;
  categorySlug?: string;
  take?: number;
}) {
  return getForumThreadsCursor({ ...opts, includePinned: !opts.cursor });
}
