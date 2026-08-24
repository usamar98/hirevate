update public.companies
set prominence_rank = 1
where lower(trim(name)) in (
  'google', 'google deepmind', 'microsoft', 'amazon', 'amazon web services', 'aws',
  'apple', 'meta', 'netflix', 'nvidia', 'adobe', 'salesforce', 'ibm', 'oracle',
  'uber', 'airbnb', 'shopify', 'atlassian', 'canva', 'spotify', 'tiktok',
  'bytedance', 'tesla', 'github'
);

update public.companies
set prominence_rank = 2
where lower(trim(name)) in (
  'coinbase', 'twilio', 'snowflake', 'gitlab', 'automattic', 'reddit', 'block',
  'wise', 'revolut', 'klarna', 'hubspot', 'servicenow', 'sap'
);
