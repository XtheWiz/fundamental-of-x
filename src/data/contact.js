// Submission endpoints for the topic-request + feedback forms.
//
// We use Tally (tally.so) — their forms embed inline as iframes inside
// our manga-styled modal, so the UX feels native to the site.
//
// If TALLY_FORMS are blanked out, the CTAs fall back to opening prefilled
// GitHub Issues, so the site never has a broken submit path.

export const TALLY_FORMS = {
  topicRequest: 'https://tally.so/r/Bz27L4',
  feedback:     'https://tally.so/r/eqYRNJ',
};

// Convert a tally.so/r/<id> page URL into the embeddable variant.
//   alignLeft=1                left-aligned inside the iframe
//   hideTitle=1                we render our own title in the modal
//   transparentBackground=1    blends into our --paper background
//   dynamicHeight=1            the embed posts its height back to us
export function tallyEmbed(formUrl, extra = {}) {
  if (!formUrl) return null;
  const id = formUrl.split('/').pop();
  const params = new URLSearchParams({
    alignLeft: '1',
    hideTitle: '1',
    transparentBackground: '1',
    dynamicHeight: '1',
    ...extra,
  });
  return `https://tally.so/embed/${id}?${params.toString()}`;
}

export const useTopicForm = !!TALLY_FORMS.topicRequest;
export const useFeedbackForm = !!TALLY_FORMS.feedback;

// GitHub fallback URLs (used when a Tally form is blank).
export const REPO = 'xthewiz/fundamental-of-x';
export function githubTopicUrl() {
  return `https://github.com/${REPO}/issues/new?template=topic-request.yml`;
}
export function githubFeedbackUrl({ topicTitle, lessonTitle, url } = {}) {
  const params = new URLSearchParams({ template: 'feedback.yml' });
  if (topicTitle && lessonTitle) params.set('title', `[feedback] ${topicTitle} · ${lessonTitle}`);
  if (url) params.set('url', url);
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}
