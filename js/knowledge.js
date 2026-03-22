// ── KNOWLEDGE REPOSITORY — BANKS ──
const bankContactDB = {
  'chase': { name: 'JPMorgan Chase', dept: 'Chase Estate Services', phone: '1-888-269-8690', hours: 'Mon–Fri 9am–5pm ET', address: 'Chase Bank Estate Services\nPO Box 659754, San Antonio TX 78265', web: 'chase.com/estate-services', form: 'Death notification form (online or in branch)', certReq: '1 certified copy (returned to you).', note: 'You can also visit any branch with the death certificate and executor documentation.' },
  'bank of america': { name: 'Bank of America', dept: 'Estate Servicing Department', phone: '1-888-689-4357', hours: 'Mon–Fri 8am–8pm ET', address: 'Estate Servicing\nPO Box 982235, El Paso TX 79998', web: 'bankofamerica.com/deposits/manage/estate-services', form: 'Notification of Death form', certReq: '1 certified copy.', note: '' },
  'wells fargo': { name: 'Wells Fargo', dept: 'Estate Care Center', phone: '1-800-869-3557', hours: 'Mon–Fri 8am–5pm ET', address: 'Wells Fargo Estate Services\nPO Box 10306, Des Moines IA 50306', web: 'wellsfargo.com/financial-education/life-events/deceased-account-holder', form: 'Estate Settlement Request', certReq: '1 certified copy.', note: '' },
  'citibank': { name: 'Citibank', dept: 'Estate Unit', phone: '1-888-248-4226', hours: 'Mon–Fri 9am–5pm ET', address: 'Citi Estate Unit\nPO Box 769006, San Antonio TX 78245', web: 'citi.com', form: 'Written notification with death certificate', certReq: '1 certified copy.', note: '' },
  default: { name: 'Financial Institution', dept: 'Estate Services Department', phone: 'See account statements', hours: 'Business hours', address: 'Mail to Estate Services at the address on your statement', web: 'Search institution name + estate services', form: 'Written notification with death certificate', certReq: '1 certified copy.', note: 'Ask to speak with the Estate Services or Bereavement team when you call.' },
};

function findBankContact(bankName) {
  const k = (bankName || '').toLowerCase();
  for (const [key, val] of Object.entries(bankContactDB)) {
    if (k.includes(key) || key.includes(k.split(' ')[0])) return val;
  }
  return { ...bankContactDB.default, name: bankName || 'Financial Institution' };
}

// ── KNOWLEDGE REPOSITORY — STREAMING SERVICES ──
const STREAMING_DATA = {
  'Netflix': { icon: '🎬', how: 'Sign in at netflix.com, Account, Cancel Membership. Or call 1-866-579-7172.', bere: 'Call 1-866-579-7172. Say you are closing an account due to a bereavement. They close same-day.' },
  'Hulu': { icon: '📺', how: 'Sign in at hulu.com, Account, Cancel.', bere: 'Call 1-888-265-6650. Mention it is a bereavement closure.' },
  'Amazon Prime': { icon: '📦', how: 'Sign in, Account & Lists, Prime Membership, End Membership.', bere: 'Call Amazon at 1-888-280-4331. Say you need to close an account due to a death.' },
  'Disney+': { icon: '🏰', how: 'Sign in, Account, Cancel Subscription.', bere: 'Call 1-888-905-7888. Mention bereavement.' },
  'Apple': { icon: '🍎', how: 'Settings → Apple ID → Subscriptions. Or call 1-800-275-2273.', bere: 'Call Apple Support. Provide the death certificate. They can close the Apple ID and all subscriptions.' },
  'Spotify': { icon: '🎵', how: 'spotify.com/account, Subscription, Cancel.', bere: 'Contact Spotify support online; explain the situation.' },
  'YouTube': { icon: '▶️', how: 'Part of Google account; manage at myaccount.google.com.', bere: 'Submit a Google deceased user request at support.google.com/accounts/troubleshooter/6357590.' },
  'Other': { icon: '📱', how: 'Log in and find Account or Settings to cancel.', bere: 'Call the customer support line and mention bereavement. Most services will close the account and refund the current billing period.' },
};

function matchStreaming(svc) {
  const k = svc.toLowerCase();
  for (const [key, val] of Object.entries(STREAMING_DATA)) {
    if (k.includes(key.toLowerCase()) || key.toLowerCase().includes(k.split(' ')[0])) return val;
  }
  return STREAMING_DATA['Other'];
}

// ── OFFICIAL SOURCE LINKS ──
// All URLs are curated official .gov / institution URLs — never AI-generated.

const STATE_GOV = {
  'Alabama': 'https://www.alabama.gov',
  'Alaska': 'https://alaska.gov',
  'Arizona': 'https://az.gov',
  'Arkansas': 'https://www.arkansas.gov',
  'California': 'https://www.ca.gov',
  'Colorado': 'https://www.colorado.gov',
  'Connecticut': 'https://portal.ct.gov',
  'Delaware': 'https://delaware.gov',
  'Florida': 'https://www.myflorida.com',
  'Georgia': 'https://georgia.gov',
  'Hawaii': 'https://www.hawaii.gov',
  'Idaho': 'https://www.idaho.gov',
  'Illinois': 'https://www.illinois.gov',
  'Indiana': 'https://www.in.gov',
  'Iowa': 'https://www.iowa.gov',
  'Kansas': 'https://www.kansas.gov',
  'Kentucky': 'https://www.kentucky.gov',
  'Louisiana': 'https://www.louisiana.gov',
  'Maine': 'https://www.maine.gov',
  'Maryland': 'https://www.maryland.gov',
  'Massachusetts': 'https://www.mass.gov',
  'Michigan': 'https://www.michigan.gov',
  'Minnesota': 'https://mn.gov',
  'Mississippi': 'https://www.ms.gov',
  'Missouri': 'https://www.mo.gov',
  'Montana': 'https://www.mt.gov',
  'Nebraska': 'https://www.nebraska.gov',
  'Nevada': 'https://www.nv.gov',
  'New Hampshire': 'https://www.nh.gov',
  'New Jersey': 'https://www.nj.gov',
  'New Mexico': 'https://www.newmexico.gov',
  'New York': 'https://www.ny.gov',
  'North Carolina': 'https://www.nc.gov',
  'North Dakota': 'https://www.nd.gov',
  'Ohio': 'https://www.ohio.gov',
  'Oklahoma': 'https://www.ok.gov',
  'Oregon': 'https://www.oregon.gov',
  'Pennsylvania': 'https://www.pa.gov',
  'Rhode Island': 'https://www.ri.gov',
  'South Carolina': 'https://www.sc.gov',
  'South Dakota': 'https://www.sd.gov',
  'Tennessee': 'https://www.tn.gov',
  'Texas': 'https://www.texas.gov',
  'Utah': 'https://www.utah.gov',
  'Vermont': 'https://www.vermont.gov',
  'Virginia': 'https://www.virginia.gov',
  'Washington': 'https://www.wa.gov',
  'West Virginia': 'https://www.wv.gov',
  'Wisconsin': 'https://www.wi.gov',
  'Wyoming': 'https://www.wy.gov',
  'Washington D.C.': 'https://www.dc.gov',
};

// Federal sources keyed by topic — these are stable official URLs.
const FEDERAL_SOURCES = {
  ssa_death:     { label: 'SSA — Report a Death', url: 'https://www.ssa.gov/pubs/EN-05-10008.pdf' },
  ssa_survivors: { label: 'SSA — Survivors Benefits', url: 'https://www.ssa.gov/survivors/' },
  irs_final:     { label: 'IRS — Final Return of a Deceased Person', url: 'https://www.irs.gov/individuals/file-the-final-income-tax-return-of-a-deceased-person' },
  irs_estate:    { label: 'IRS — Estate Tax', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/estate-tax' },
  va_burial:     { label: 'VA — Burial Benefits', url: 'https://www.va.gov/burials-memorials/veterans-burial-allowance/' },
  va_dic:        { label: 'VA — Dependency and Indemnity Compensation', url: 'https://www.va.gov/disability/dependency-indemnity-compensation/' },
  medicare:      { label: 'Medicare — After Someone Dies', url: 'https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/after-someone-with-medicare-dies' },
  medicaid:      { label: 'Medicaid — Estate Recovery', url: 'https://www.medicaid.gov/medicaid/eligibility/estate-recovery/index.html' },
  dol_cobra:     { label: 'DOL — COBRA Continuation Coverage', url: 'https://www.dol.gov/general/topic/health-plans/cobra' },
  dol_pension:   { label: 'DOL — Finding a Pension', url: 'https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/finding-a-lost-pension' },
  pbgc:          { label: 'PBGC — Unclaimed Pensions', url: 'https://www.pbgc.gov/about/pg/other/unclaimed-pensions' },
  sec_transfer:  { label: 'SEC — Transferring Brokerage Accounts', url: 'https://www.investor.gov/introduction-investing/investing-basics/how-keep-your-investments-safe/transferring-account' },
  ftc_identity:  { label: 'FTC — Deceased Person Identity Theft', url: 'https://consumer.ftc.gov/articles/deceased-person-identity-theft' },
};

// ── LEGAL AUTHORITY — FEDERAL LAW CITATIONS ──
// Maps task content to the specific federal statutes, regulations, and publications
// that mandate or govern each action. All citations are curated and verifiable.
// Returns [{cite, note}] where cite is the statutory reference and note is the plain-language rule.
function getLegalBasis(task) {
  const n = (task.name || '').toLowerCase();
  const basis = [];

  if (n.includes('death certificate') || n.includes('vital records')) {
    basis.push({ cite: 'State vital records law', note: 'Death must be registered with the state registrar; certified copies required by virtually all institutions.' });
  }
  if ((n.includes('social security') || n.includes('ssa')) && !n.includes('survivor')) {
    basis.push({ cite: '42 U.S.C. § 402; 20 C.F.R. § 404.301', note: 'SSA benefits cease the month of death. Any payment received for months after death must be returned.' });
  }
  if (n.includes('survivor') && (n.includes('social security') || n.includes('ssa') || n.includes('child') || n.includes('spouse'))) {
    basis.push({ cite: '42 U.S.C. §§ 402(d), 402(e)', note: 'Surviving spouse and children under 18 may receive survivor benefits based on the deceased\'s earnings record.' });
    basis.push({ cite: '20 C.F.R. Part 404, Subpart D', note: 'Governing regulations for Social Security survivor benefit eligibility and application.' });
  }
  if (n.includes('federal') && n.includes('tax')) {
    basis.push({ cite: 'IRC § 6012(b)(1); 26 C.F.R. § 1.6012-3(b)(1)', note: 'Executor must file a final Form 1040 for the decedent for the year of death. Due April 15 of the following year.' });
    basis.push({ cite: 'IRS Publication 559', note: 'IRS guide for survivors and estate administrators — estate income, deductions, and when Form 1041 is required.' });
  }
  if (n.includes('state') && n.includes('tax')) {
    basis.push({ cite: 'State revenue code (varies by state)', note: 'State income tax return required in states with income tax. Some states also impose an estate or inheritance tax with separate filing requirements.' });
  }
  if (n.includes('probate') || n.includes('letters testamentary') || n.includes('executor authority')) {
    basis.push({ cite: 'State probate code (varies by state)', note: 'Executor authority is conferred by the probate court via Letters Testamentary. No financial institution or government agency will accept instructions without this document.' });
    basis.push({ cite: 'Uniform Probate Code (where adopted)', note: 'Governs estate administration procedure in states that have adopted the UPC.' });
  }
  if (n.includes('credit bureau') || n.includes('deceased alert')) {
    basis.push({ cite: 'FCRA § 623; 15 U.S.C. § 1681s-2', note: 'Furnishers of information must report accurate data. A deceased alert stops fraudulent credit applications in the decedent\'s name.' });
    basis.push({ cite: 'FTC guidance — Deceased Person Identity Theft', note: 'FTC recommends placing a deceased alert with all three credit bureaus immediately.' });
  }
  if (n.includes('employer') || n.includes('hr') || n.includes('paycheck') || n.includes('payroll')) {
    basis.push({ cite: 'FLSA, 29 U.S.C. § 206; state wage payment laws', note: 'Employers must pay all earned wages to the estate. State laws dictate how quickly the final paycheck must be issued (often 72 hours to next regular pay date).' });
    basis.push({ cite: 'ERISA § 205; 29 U.S.C. § 1055', note: 'Spouse of a plan participant may have survivor benefit rights under the plan\'s qualified preretirement survivor annuity (QPSA) provisions.' });
  }
  if (n.includes('cobra') || (n.includes('health') && n.includes('coverage'))) {
    basis.push({ cite: 'ERISA §§ 601–608; 26 U.S.C. § 4980B', note: 'Dependents have exactly 60 days to elect COBRA continuation coverage after the qualifying event (death of covered employee). Missing this deadline permanently forfeits coverage.' });
    basis.push({ cite: '29 C.F.R. Part 2590.606', note: 'Employer must provide COBRA election notice within 14 days of receiving notice of the qualifying event.' });
  }
  if (n.includes('401') || n.includes('403') || n.includes('retirement plan')) {
    basis.push({ cite: 'ERISA § 205; IRC § 401(a)(11)', note: 'Spouse is the default beneficiary of qualified retirement plans unless they have waived this right in writing.' });
    basis.push({ cite: 'SECURE 2.0 Act (P.L. 117-328) § 327', note: 'Non-spouse beneficiaries must generally distribute inherited account within 10 years under the updated 10-year rule.' });
  }
  if (n.includes('roth ira') || (n.includes('roth') && n.includes('ira'))) {
    basis.push({ cite: 'IRC § 408A; SECURE 2.0 Act (P.L. 117-328)', note: 'No required minimum distributions from inherited Roth IRA during the 10-year distribution window for most non-spouse beneficiaries.' });
  }
  if (n.includes('traditional ira') || (n.includes('ira') && !n.includes('roth'))) {
    basis.push({ cite: 'IRC § 408; 26 C.F.R. § 1.408-8', note: 'RMD for the year of death must be distributed to beneficiaries if the decedent had not yet taken it. 10-year rule applies to most non-spouse beneficiaries.' });
    basis.push({ cite: 'SECURE 2.0 Act (P.L. 117-328) § 107', note: 'Eliminates the RMD excise tax penalty for inherited IRAs under certain conditions.' });
  }
  if (n.includes('life insurance')) {
    basis.push({ cite: 'IRC § 101(a)', note: 'Life insurance death benefits paid to named beneficiaries are generally excluded from the beneficiary\'s gross income — they are income-tax-free.' });
    basis.push({ cite: 'State insurance code (varies)', note: 'State law governs the claims process and timelines for insurers to pay death benefits (typically 30–60 days after receiving a complete claim).' });
  }
  if (n.includes('real property') || n.includes('real estate') || n.includes('deed')) {
    basis.push({ cite: 'IRC § 1014; 26 U.S.C. § 1014', note: 'Inherited real estate receives a stepped-up cost basis to fair market value at date of death, which reduces capital gains tax when sold.' });
    basis.push({ cite: 'State property and probate law (varies)', note: 'Transfer of real property requires either a deed of distribution through probate or a trustee\'s deed if held in trust. Joint tenancy transfers via death certificate only.' });
  }
  if (n.includes('mortgage')) {
    basis.push({ cite: 'Garn-St. Germain Act, 12 U.S.C. § 1701j-3', note: 'Lenders cannot invoke a due-on-sale clause when property transfers to a relative of the borrower upon death. The estate or heir may assume the mortgage.' });
  }
  if (n.includes('student loan')) {
    basis.push({ cite: '20 U.S.C. § 1087(a); 34 C.F.R. § 685.212(a)', note: 'Federal Direct Loans are discharged upon the borrower\'s death. Submit a certified death certificate to the servicer. Private loan terms vary by contract.' });
  }
  if (n.includes('medicare')) {
    basis.push({ cite: '42 U.S.C. § 1395 et seq.', note: 'Medicare entitlement ends upon death. Report the death to prevent improper payments, which must be returned.' });
  }
  if (n.includes('medicaid')) {
    basis.push({ cite: '42 U.S.C. § 1396p(b)', note: 'States are required to seek recovery from the estates of Medicaid recipients age 55+ for the cost of benefits paid. This is a mandatory federal program.' });
  }
  if (n.includes('veteran') || n.includes('va ') || n.includes('burial')) {
    basis.push({ cite: '38 U.S.C. § 2302; 38 C.F.R. § 38.620', note: 'Veterans are entitled to a burial allowance, grave marker, and American flag. Service-connected death allows up to $2,000 burial allowance.' });
    basis.push({ cite: '38 U.S.C. § 1310 (DIC)', note: 'Surviving spouse and dependents may qualify for Dependency and Indemnity Compensation if death was service-connected.' });
  }
  if (n.includes('pension') && !n.includes('employer')) {
    basis.push({ cite: 'ERISA § 205; 29 U.S.C. § 1055', note: 'Defined benefit plans must provide a Qualified Preretirement Survivor Annuity to a surviving spouse unless waived.' });
    basis.push({ cite: 'PBGC regulations', note: 'PBGC insures pension benefits up to federal limits in the event of plan termination.' });
  }
  if (n.includes('brokerage') || n.includes('investment')) {
    basis.push({ cite: 'IRC § 1014', note: 'Inherited brokerage assets receive a stepped-up cost basis to date-of-death fair market value, resetting capital gains.' });
    basis.push({ cite: 'SEC Rule 15c3-3; FINRA Rule 4370', note: 'Brokerage firms must follow established procedures for transferring or liquidating accounts held by deceased customers.' });
  }
  if (n.includes('safe deposit')) {
    basis.push({ cite: 'State banking law (varies)', note: 'Most states require a court order or Letters Testamentary to access a box held solely in the decedent\'s name. Joint boxes may be accessed by the surviving owner.' });
  }
  if (n.includes('old employer') || n.includes('unclaimed')) {
    basis.push({ cite: '29 C.F.R. § 2550.401a-1; PBGC Act', note: 'DOL and PBGC maintain records of abandoned and terminated plans. Unclaimed benefits may be held by the PBGC or state unclaimed property programs.' });
  }
  if (n.includes('vehicle') || n.includes('dmv')) {
    basis.push({ cite: 'State vehicle code (varies)', note: 'Vehicle title transfer requires the original title, a certified death certificate, and executor credentials. Process and fees vary by state DMV.' });
  }
  if (n.includes('credit card')) {
    basis.push({ cite: 'State estate creditor priority law', note: 'Unsecured debts like credit cards are paid after secured creditors, taxes, and administrative expenses in the statutory creditor priority order.' });
  }
  if (n.includes('cryptocurrency') || n.includes('digital assets')) {
    basis.push({ cite: 'Revised Uniform Fiduciary Access to Digital Assets Act (RUFADAA)', note: 'Adopted in most states; gives executors the right to access and manage digital assets including cryptocurrency. Check whether the deceased left a legacy contact or digital instructions.' });
  }

  return basis;
}

// Returns an array of {label, url} source objects relevant to a given task + state.
// Sources are strictly from curated official URLs — never AI-generated.
function getTaskSources(task, state) {
  const n = (task.name || '').toLowerCase();
  const cat = (task.category || '').toLowerCase();
  const sources = [];

  // Always include the state's official government portal for state-specific tasks
  const statePortal = state && STATE_GOV[state];

  if (n.includes('death certificate') || n.includes('vital records')) {
    if (statePortal) sources.push({ label: `${state} Official Portal — Vital Records`, url: statePortal });
  }

  if (n.includes('social security') || n.includes('ssa')) {
    if (n.includes('survivor')) sources.push(FEDERAL_SOURCES.ssa_survivors);
    else sources.push(FEDERAL_SOURCES.ssa_death);
  }

  if (n.includes('probate') || n.includes('letters testamentary') || n.includes('executor authority')) {
    if (statePortal) sources.push({ label: `${state} Official Portal — Probate & Courts`, url: statePortal });
  }

  if (n.includes('tax return') || n.includes('income tax')) {
    sources.push(FEDERAL_SOURCES.irs_final);
    if (n.includes('estate tax')) sources.push(FEDERAL_SOURCES.irs_estate);
    if (statePortal) sources.push({ label: `${state} Revenue Department`, url: statePortal });
  }

  if (n.includes('credit bureau') || n.includes('identity')) {
    sources.push(FEDERAL_SOURCES.ftc_identity);
  }

  if (n.includes('veteran') || n.includes('va ') || n.includes('burial')) {
    sources.push(FEDERAL_SOURCES.va_burial);
    sources.push(FEDERAL_SOURCES.va_dic);
  }

  if (n.includes('medicare') || n.includes('medicaid')) {
    sources.push(FEDERAL_SOURCES.medicare);
    if (n.includes('medicaid')) sources.push(FEDERAL_SOURCES.medicaid);
  }

  if (n.includes('cobra') || n.includes('health coverage') || n.includes('employer hr')) {
    sources.push(FEDERAL_SOURCES.dol_cobra);
  }

  if (n.includes('pension') || n.includes('old employer') || n.includes('retirement plan')) {
    sources.push(FEDERAL_SOURCES.dol_pension);
    if (n.includes('old employer') || n.includes('unclaimed')) sources.push(FEDERAL_SOURCES.pbgc);
  }

  if (n.includes('brokerage') || n.includes('investment')) {
    sources.push(FEDERAL_SOURCES.sec_transfer);
  }

  if (n.includes('real property') || n.includes('vehicle') || n.includes('dmv') || n.includes('deed')) {
    if (statePortal) sources.push({ label: `${state} Official Portal — Property & DMV`, url: statePortal });
  }

  if (n.includes('medicaid') || (cat.includes('notification') && state)) {
    if (statePortal && !sources.some(s => s.url === statePortal)) {
      sources.push({ label: `${state} Official Government Portal`, url: statePortal });
    }
  }

  // For all government/legal and survivor benefit tasks, ensure state portal is listed
  if ((cat.includes('government') || cat.includes('survivor')) && statePortal && !sources.some(s => s.url === statePortal)) {
    sources.push({ label: `${state} Official Government Portal`, url: statePortal });
  }

  return sources;
}

// ── TASK OPTIONS ─────────────────────────────────────────────────────────────
// Returns the available action channels for a task (call, letter, online, etc.)
// type: 'call' | 'letter' | 'link' | 'info' | 'lawyer'
function getTaskOptions(task, state) {
  const n = (task.name || '').toLowerCase();
  const sg = STATE_GOV[state] || 'https://usa.gov';

  // ── SSA – stop/report payments ──────────────────────────────────────────
  if ((n.includes('social security') || n.includes('ssa')) && !n.includes('survivor')) {
    return [
      { id: 'call', icon: '📞', label: 'Call SSA', desc: '1-800-772-1213 · Mon–Fri 8am–7pm local time', type: 'call',
        phone: '1-800-772-1213', hours: 'Mon–Fri, 8 am–7 pm (your local time)',
        script: 'Tell the agent you are calling to report the death of a benefits recipient and need to stop payments. Have the deceased\'s full name, Social Security number, and date of death ready. Ask about any lump-sum death payment ($255) and whether any survivors may qualify for monthly benefits.' },
      { id: 'visit', icon: '🏢', label: 'Visit a local SSA office', desc: 'Bring a certified death certificate and your photo ID', type: 'link',
        url: 'https://www.ssa.gov/locator/', linkLabel: 'Find your nearest SSA office →' },
    ];
  }

  // ── SSA – survivor benefits ──────────────────────────────────────────────
  if (n.includes('survivor') && (n.includes('social security') || n.includes('ssa') || n.includes('benefit'))) {
    return [
      { id: 'call', icon: '📞', label: 'Call SSA to apply', desc: '1-800-772-1213 · Fastest way to open a claim', type: 'call',
        phone: '1-800-772-1213', hours: 'Mon–Fri, 8 am–7 pm (your local time)',
        script: 'Tell the agent you would like to apply for survivor benefits. Have the deceased\'s Social Security number, the claimant\'s Social Security number, a certified death certificate, and — for a spouse — your marriage certificate. For children, bring their birth certificates.' },
      { id: 'visit', icon: '🏢', label: 'Visit a local SSA office', desc: 'Bring all supporting documents in person', type: 'link',
        url: 'https://www.ssa.gov/locator/', linkLabel: 'Find your nearest SSA office →' },
    ];
  }

  // ── Credit bureaus ────────────────────────────────────────────────────────
  if (n.includes('credit bureau') || n.includes('deceased alert') || n.includes('credit report')) {
    return [
      { id: 'equifax', icon: '📞', label: 'Call Equifax', desc: '1-800-685-1111', type: 'call',
        phone: '1-800-685-1111', hours: 'Mon–Fri business hours',
        script: 'Say you are calling to place a deceased alert on a credit file. Provide the full name, Social Security number, and date of death. Ask for written confirmation that the alert was placed.' },
      { id: 'experian', icon: '📞', label: 'Call Experian', desc: '1-888-397-3742', type: 'call',
        phone: '1-888-397-3742', hours: 'Mon–Fri business hours',
        script: 'Same as above — state you are reporting a death and want a deceased alert placed on the credit file.' },
      { id: 'transunion', icon: '📞', label: 'Call TransUnion', desc: '1-800-916-8800', type: 'call',
        phone: '1-800-916-8800', hours: 'Mon–Fri business hours',
        script: 'Same as above — report the death and request the deceased alert.' },
      { id: 'ftc', icon: '🌐', label: 'FTC guide on identity theft after death', desc: 'How to protect the estate from fraud', type: 'link',
        url: 'https://consumer.ftc.gov/articles/deceased-person-identity-theft', linkLabel: 'FTC — Deceased Person Identity Theft →' },
    ];
  }

  // ── VA / veterans ──────────────────────────────────────────────────────────
  if (n.includes('veteran') || n.includes('va ') || n.includes('burial allow') || n.includes('military benefit') || n.includes('va benefit')) {
    return [
      { id: 'call', icon: '📞', label: 'Call the VA', desc: '1-800-827-1000 · Mon–Fri 8am–9pm ET', type: 'call',
        phone: '1-800-827-1000', hours: 'Mon–Fri, 8 am–9 pm Eastern',
        script: 'Say you are calling to report the death of a veteran and stop any ongoing VA payments. Also ask about the burial allowance (VA Form 21P-530EZ) and Dependency and Indemnity Compensation (DIC) for eligible survivors. Have the veteran\'s full name, Social Security number, VA file number, and date of death ready.' },
      { id: 'online', icon: '🌐', label: 'File burial claim at VA.gov', desc: 'Submit VA Form 21P-530EZ online', type: 'link',
        url: 'https://www.va.gov/burials-memorials/veterans-burial-allowance/', linkLabel: 'VA.gov — Burial Benefits →' },
      { id: 'visit', icon: '🏢', label: 'Visit a VA regional office', desc: 'In-person help from a VA representative', type: 'link',
        url: 'https://www.va.gov/find-locations/', linkLabel: 'Find a VA location →' },
    ];
  }

  // ── Medicare / Medicaid ────────────────────────────────────────────────────
  if (n.includes('medicare') || n.includes('medicaid')) {
    return [
      { id: 'call', icon: '📞', label: 'Call Medicare', desc: '1-800-633-4227 · Available 24/7', type: 'call',
        phone: '1-800-633-4227', hours: '24 hours a day, 7 days a week',
        script: 'Say you are calling to report the death of a Medicare beneficiary and stop coverage. Have the deceased\'s Medicare card or Medicare Beneficiary Identifier (MBI) number ready.' },
      { id: 'online', icon: '🌐', label: 'Medicare — what to do after a death', desc: 'Official guidance on stopping coverage', type: 'link',
        url: 'https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/after-someone-with-medicare-dies', linkLabel: 'Medicare.gov — after a death →' },
    ];
  }

  // ── Bank / financial accounts ──────────────────────────────────────────────
  if (n.includes('bank') || n.includes('deposit account') || n.includes('financial account') || n.includes('investment account')) {
    return [
      { id: 'letter', icon: '✉️', label: 'Send a formal notification letter', desc: 'Creates an official paper trail — recommended', type: 'letter' },
      { id: 'visit', icon: '🏢', label: 'Visit a branch in person', desc: 'Ask for the estate services team', type: 'info',
        steps: ['Bring a certified death certificate (original copy)', 'Bring your government-issued photo ID', 'Bring Letters Testamentary or other executor credentials', 'Ask specifically for the estate services or bereavement team'] },
      { id: 'call', icon: '📞', label: 'Call the estate services line', desc: 'Most banks have a dedicated bereavement number', type: 'call',
        phone: 'See account statement or bank website', hours: 'Business hours',
        script: 'Say you are calling the estate services team to notify the bank of a death and begin the account settlement process. Have the account number and death certificate ready. Ask what documents they need and their preferred process.' },
    ];
  }

  // ── Employer / HR ─────────────────────────────────────────────────────────
  if (n.includes('employer') || n.includes('hr department') || n.includes('payroll') || n.includes('notify employer')) {
    return [
      { id: 'letter', icon: '✉️', label: 'Send an email or formal letter', desc: 'Creates a written record — recommended', type: 'letter' },
      { id: 'call', icon: '📞', label: 'Call HR directly', desc: 'Ask for the HR or benefits department by name', type: 'call',
        phone: 'Check company website, pay stub, or HR portal', hours: 'Business hours',
        script: 'Say you are calling to notify HR of the death of an employee. Ask about: stopping payroll, the final paycheck timeline, group life insurance, 401(k) beneficiary distribution, and COBRA continuation coverage for any dependents.' },
    ];
  }

  // ── Life insurance ────────────────────────────────────────────────────────
  if (n.includes('life insurance')) {
    return [
      { id: 'letter', icon: '✉️', label: 'Send a formal claim letter', desc: 'Include a certified death certificate', type: 'letter' },
      { id: 'call', icon: '📞', label: 'Call the insurer\'s claims line', desc: 'Ask for the life insurance claims department', type: 'call',
        phone: 'See the policy document or the back of your insurance card', hours: 'Business hours',
        script: 'Say you are calling to file a life insurance death benefit claim. Have the policy number and a death certificate ready. Ask about the typical processing timeline and what forms must be submitted.' },
      { id: 'online', icon: '🌐', label: 'File claim online', desc: 'Many insurers accept claims through their website', type: 'info',
        steps: ['Go to the insurer\'s website and navigate to Claims or Customer Service', 'Look for "Life Insurance Claim" or "Death Claim"', 'Upload a scanned death certificate and complete the claim form', 'Note the claim reference number for follow-up'] },
    ];
  }

  // ── Probate / executor authority ───────────────────────────────────────────
  if (n.includes('probate') || n.includes('letters testamentary') || n.includes('executor authority') || n.includes('initiate probate')) {
    return [
      { id: 'attorney', icon: '⚖️', label: 'Work with an estate attorney', desc: 'Strongly recommended — attorneys handle filing and court interactions', type: 'lawyer' },
      { id: 'court', icon: '🏛️', label: `File with ${state} probate court directly`, desc: 'Self-represented filing is possible but requires careful attention to local rules', type: 'link',
        url: sg, linkLabel: `${state} official government portal →` },
    ];
  }

  // ── Real property / deed transfer ─────────────────────────────────────────
  if (n.includes('real property') || n.includes('real estate') || n.includes('deed') || n.includes('property transfer')) {
    return [
      { id: 'attorney', icon: '⚖️', label: 'Work with an estate attorney', desc: 'Required for most property transfers through probate', type: 'lawyer' },
      { id: 'court', icon: '🏛️', label: `${state} Registry of Deeds`, desc: 'Deed transfer is filed here after probate is complete', type: 'link',
        url: sg, linkLabel: `${state} official portal →` },
    ];
  }

  // ── DMV / vehicle title ───────────────────────────────────────────────────
  if (n.includes('vehicle') || n.includes('dmv') || n.includes('car title')) {
    return [
      { id: 'visit', icon: '🚗', label: 'Visit the DMV in person', desc: 'Required in most states for title transfer', type: 'info',
        steps: [
          'Locate the original vehicle title (check the glove box or safe)',
          'Bring a certified death certificate',
          'Bring your Letters Testamentary or executor credentials',
          'Bring your government-issued photo ID',
          `Go to any ${state} DMV location`,
        ] },
      { id: 'online', icon: '🌐', label: `${state} DMV website`, desc: 'Check specific requirements and book an appointment', type: 'link',
        url: sg, linkLabel: `${state} official portal →` },
    ];
  }

  // ── Final tax return ──────────────────────────────────────────────────────
  if (n.includes('tax return') || n.includes('income tax') || n.includes('final tax')) {
    return [
      { id: 'cpa', icon: '👩‍💼', label: 'Hire a CPA or tax professional', desc: 'Recommended — they can file Form 1041 (estate income) if needed', type: 'info',
        steps: [
          'Find a CPA with experience in estate tax returns',
          'Gather all W-2s, 1099s, and investment account statements',
          'They will file Form 1040 for the final personal return',
          'If the estate earns income after death, they will also file Form 1041',
        ] },
      { id: 'software', icon: '💻', label: 'Use tax software (TurboTax, H&R Block)', desc: 'Both support deceased taxpayer returns', type: 'link',
        url: 'https://www.irs.gov/individuals/file-the-final-income-tax-return-of-a-deceased-person', linkLabel: 'IRS — how to file the final return →' },
    ];
  }

  // ── Mortgage servicer ─────────────────────────────────────────────────────
  if (n.includes('mortgage') || n.includes('home loan') || n.includes('servicer')) {
    return [
      { id: 'call', icon: '📞', label: 'Call the mortgage servicer', desc: 'Ask for loss mitigation or the bereavement department', type: 'call',
        phone: 'See your mortgage statement', hours: 'Business hours',
        script: 'Say you are calling to notify the servicer of the homeowner\'s death and ask about next steps. Ask about the Garn–St. Germain Act — servicers cannot require immediate loan payoff simply due to a death. Ask what documents they need from you as executor.' },
      { id: 'letter', icon: '✉️', label: 'Send written notification', desc: 'Creates a formal paper trail with the servicer', type: 'letter' },
    ];
  }

  // ── Student loans ─────────────────────────────────────────────────────────
  if (n.includes('student loan')) {
    return [
      { id: 'call', icon: '📞', label: 'Call the loan servicer', desc: 'Federal loans may be discharged — call to request', type: 'call',
        phone: '1-800-4-FED-AID for federal loans (1-800-433-3243)', hours: 'Mon–Fri, 8 am–11 pm ET',
        script: 'Say you are calling to request a death discharge for federal student loans. They will ask you to mail a certified death certificate. Ask for the discharge request form and the exact mailing address.' },
      { id: 'letter', icon: '✉️', label: 'Send written discharge request', desc: 'Mail with a certified death certificate attached', type: 'letter' },
      { id: 'online', icon: '🌐', label: 'Federal Student Aid — death discharge', desc: 'Official process and forms', type: 'link',
        url: 'https://studentaid.gov/manage-loans/forgiveness-cancellation/death', linkLabel: 'StudentAid.gov — Death Discharge →' },
    ];
  }

  // ── Homeowner\'s insurance ─────────────────────────────────────────────────
  if (n.includes('homeowner') || (n.includes('insurance') && (n.includes('maintain') || n.includes('property')))) {
    return [
      { id: 'call', icon: '📞', label: 'Call the insurance agent or company', desc: 'Notify immediately — unoccupied homes can lose coverage', type: 'call',
        phone: 'See the insurance policy declarations page', hours: 'Business hours',
        script: 'Say you are calling to notify the insurer of the homeowner\'s death and ask about a vacancy or estate endorsement to keep coverage active while the estate is settled. Ask how many days of vacancy are allowed before coverage lapses.' },
      { id: 'letter', icon: '✉️', label: 'Send a written notification', desc: 'For your records and the insurer\'s file', type: 'letter' },
    ];
  }

  // ── Credit cards ──────────────────────────────────────────────────────────
  if (n.includes('credit card')) {
    return [
      { id: 'call', icon: '📞', label: 'Call each card issuer', desc: 'Ask for the estate or bereavement department', type: 'call',
        phone: 'Number on the back of each card or monthly statement', hours: 'Business hours',
        script: 'Say you are calling to notify the company of the cardholder\'s death and close the account. Ask for the current balance, how to pay it from the estate, and confirmation that the account is closed.' },
      { id: 'letter', icon: '✉️', label: 'Send written notification', desc: 'One letter per issuer, with death certificate copy', type: 'letter' },
    ];
  }

  // ── Safe deposit box ──────────────────────────────────────────────────────
  if (n.includes('safe deposit')) {
    return [
      { id: 'visit', icon: '🏢', label: 'Visit the bank with your credentials', desc: 'A bank officer must accompany you by law', type: 'info',
        steps: [
          'Obtain Letters Testamentary from the probate court first',
          'Call the bank in advance to schedule a supervised access appointment',
          'Bring a certified death certificate and your photo ID',
          'A bank officer will accompany you to open the box',
          'Document and photograph all contents before removing anything',
        ] },
    ];
  }

  // ── Facebook / Instagram ──────────────────────────────────────────────────
  if (n.includes('facebook') || n.includes('instagram')) {
    return [
      { id: 'memorialize', icon: '🌐', label: 'Request memorialization', desc: 'Profile becomes a memorial space for family and friends', type: 'link',
        url: 'https://www.facebook.com/help/contact/228813257197480', linkLabel: 'Facebook memorialization request →' },
      { id: 'remove', icon: '🌐', label: 'Request account removal', desc: 'Permanently delete the profile', type: 'link',
        url: 'https://www.facebook.com/help/contact/228813257197480', linkLabel: 'Facebook removal request →' },
    ];
  }

  // ── Google / Gmail ────────────────────────────────────────────────────────
  if (n.includes('google') || n.includes('gmail')) {
    return [
      { id: 'online', icon: '🌐', label: 'Submit a Google deceased user request', desc: 'Request data access or account deletion', type: 'link',
        url: 'https://support.google.com/accounts/troubleshooter/6357590', linkLabel: 'Google — deceased user request →' },
    ];
  }

  // ── Apple / iCloud ────────────────────────────────────────────────────────
  if (n.includes('apple') || n.includes('icloud')) {
    return [
      { id: 'call', icon: '📞', label: 'Call Apple Support', desc: '1-800-275-2273 · Available 24/7', type: 'call',
        phone: '1-800-275-2273', hours: '24/7',
        script: 'Say you are calling to close an Apple ID account due to the death of the account holder. Ask about the Digital Legacy program if you need to retrieve photos or important data first.' },
      { id: 'online', icon: '🌐', label: 'Apple Digital Legacy program', desc: 'Access account data if you were a designated legacy contact', type: 'link',
        url: 'https://support.apple.com/en-us/HT212360', linkLabel: 'Apple — Digital Legacy →' },
    ];
  }

  // ── Amazon / Prime ────────────────────────────────────────────────────────
  if (n.includes('amazon') || n.includes('prime')) {
    return [
      { id: 'call', icon: '📞', label: 'Call Amazon customer service', desc: '1-888-280-4331 · Available 24/7', type: 'call',
        phone: '1-888-280-4331', hours: '24/7',
        script: 'Say you need to close an Amazon account due to the death of the account holder. Ask them to cancel Prime, any subscriptions, and close the account entirely.' },
      { id: 'chat', icon: '💬', label: 'Use Amazon live chat', desc: 'Account closure is also available via chat', type: 'link',
        url: 'https://www.amazon.com/gp/help/customer/display.html', linkLabel: 'Amazon — Customer Service →' },
    ];
  }

  // ── Pension ───────────────────────────────────────────────────────────────
  if (n.includes('pension') || n.includes('retirement plan') || n.includes('401k') || n.includes('403b')) {
    return [
      { id: 'call', icon: '📞', label: 'Call the plan administrator', desc: 'Contact the employer or plan custodian', type: 'call',
        phone: 'See the most recent pension or account statement', hours: 'Business hours',
        script: 'Say you are calling to report the death of a plan participant and inquire about survivor benefit options, including any QPSA (Qualified Preretirement Survivor Annuity) rights, rollover options for beneficiaries, and required distribution rules.' },
      { id: 'letter', icon: '✉️', label: 'Send a formal notification', desc: 'Include the death certificate and executor credentials', type: 'letter' },
    ];
  }

  // ── Streaming / subscriptions ─────────────────────────────────────────────
  if (n.includes('streaming') || n.includes('subscri') || n.includes('netflix') || n.includes('spotify') || n.includes('hulu')) {
    return [
      { id: 'letter', icon: '📺', label: 'Cancel each service', desc: 'Follow the cancellation steps for each subscription below', type: 'letter' },
      { id: 'call', icon: '📞', label: 'Call customer service for each service', desc: 'Ask for a bereavement cancellation and any prorated refund', type: 'call',
        phone: 'See each service\'s website for their support number', hours: 'Varies by service',
        script: 'Say you are calling to cancel an account due to the death of the account holder. Ask about any unused prepaid period and whether a partial refund is available. Ask them to confirm the cancellation in writing via email.' },
    ];
  }

  // ── COBRA / health coverage continuation ─────────────────────────────────
  if (n.includes('cobra') || n.includes('health coverage') || n.includes('health insurance') || n.includes('health benefit')) {
    return [
      { id: 'call', icon: '📞', label: 'Call HR or the plan administrator immediately', desc: 'You have only 60 days to elect COBRA — do not delay', type: 'call',
        phone: 'Check the employer\'s website, pay stub, or HR portal', hours: 'Business hours',
        script: 'Say you are calling to notify HR of the death and request COBRA election paperwork for covered dependents. Confirm the exact date the qualifying event occurred — the 60-day election window starts from that date, not from when the paperwork arrives.' },
      { id: 'online', icon: '🌐', label: 'DOL — COBRA rights overview', desc: 'Your full rights under federal law', type: 'link',
        url: 'https://www.dol.gov/general/topic/health-plans/cobra', linkLabel: 'DOL — COBRA Continuation Coverage →' },
    ];
  }

  // ── Death certificates / vital records ───────────────────────────────────
  if (n.includes('death certificate') || n.includes('vital record')) {
    return [
      { id: 'visit', icon: '🏛️', label: 'Order from the vital records office', desc: `Visit or mail to ${state} vital records — fastest for certified copies`, type: 'link',
        url: sg, linkLabel: `${state} official vital records →` },
      { id: 'online', icon: '🌐', label: 'Order through VitalChek (online)', desc: 'Official third-party ordering service used by most states', type: 'link',
        url: 'https://www.vitalchek.com', linkLabel: 'VitalChek — order certified copies →' },
    ];
  }

  // ── Cryptocurrency / digital assets ──────────────────────────────────────
  if (n.includes('cryptocurrency') || n.includes('crypto') || n.includes('digital asset') || n.includes('bitcoin')) {
    return [
      { id: 'attorney', icon: '⚖️', label: 'Consult an estate attorney with crypto experience', desc: 'Strongly recommended — accessing wallets without keys can be impossible', type: 'lawyer' },
      { id: 'info', icon: '🔑', label: 'Locate wallet keys and exchange accounts', desc: 'Key steps to access or close crypto accounts', type: 'info',
        steps: [
          'Search for a hardware wallet (Ledger, Trezor) or recovery seed phrase in documents and safes',
          'Check for exchange accounts (Coinbase, Kraken, Binance) in the deceased\'s email',
          'Contact each exchange with a death certificate and your executor credential — most have a formal deceased user process',
          'If no seed phrase is found for a self-custody wallet, consult a crypto recovery specialist (no guarantees)',
        ] },
    ];
  }

  // ── Default — generic notification task ───────────────────────────────────
  return [
    { id: 'letter', icon: '✉️', label: 'Send a written notification', desc: 'Creates a formal record and paper trail', type: 'letter' },
    { id: 'call', icon: '📞', label: 'Call directly', desc: 'Check the institution\'s website or statement for the contact number', type: 'call',
      phone: '', hours: 'Business hours',
      script: 'Identify yourself as the executor of the estate. State the full name of the deceased and the date of death. Ask about their estate settlement process and what documents they need from you.' },
  ];
}
