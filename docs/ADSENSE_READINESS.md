# AdSense and Analytics
Publisher IDs are validated. ads.txt contains only the configured publisher ID. Advertising script now requires a public site, valid ID, NEXT_PUBLIC_ADSENSE_APPROVED=true and NEXT_PUBLIC_CMP_READY=true. These flags do not implement a CMP or prove compliance. Leave them false until the owner integrates and verifies a certified CMP and account approval.

Google requires a certified CMP with TCF support for personalized ads in EEA/UK/Switzerland: https://support.google.com/adsense/answer/13554116?hl=en

GA4 env placeholder exists but analytics/event integration is not implemented. No document contents or filenames are sent to analytics by these changes. Search Console verification remains environment-based. Google approval and earnings are external statuses and have not been verified.
