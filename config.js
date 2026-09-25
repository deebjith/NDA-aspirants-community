/* Supabase browser configuration */
window.NDA_SUPABASE_CONFIG = {
  url: 'https://kcgzevzgcitmpfwielzb.supabase.co',
  publishableKey: 'sb_publishable_DBSYAh_56LWTpB3nCI6xkw_GMP1obe_'
};

/* Load the optional responsive refresh without changing backend credentials. */
(() => {
  const theme = document.createElement('link');
  theme.rel = 'stylesheet'; theme.href = '/mobile-refresh.css?v=20260925'; theme.dataset.siteRefresh = 'theme';
  document.head.appendChild(theme);
  const loadEnhancements = () => {
    const script = document.createElement('script');
    script.src = '/mobile-refresh.js?v=20260925'; script.defer = true; script.dataset.siteRefresh = 'features';
    document.body.appendChild(script);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadEnhancements, { once: true });
  else loadEnhancements();
})();
