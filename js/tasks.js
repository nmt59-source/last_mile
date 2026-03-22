// ── TASK GENERATION ──
// Tasks are built deterministically from intake data so nothing is missed or invented.
// AI then enriches each task description with state-specific guidance.
async function genTasks() {
  const coreTasks = buildIntakeTasks();
  // Attach curated legal authority citations to every task
  coreTasks.forEach(t => { t.legalBasis = getLegalBasis(t); });
  tasks = coreTasks.concat(customTasks);
  tasks.forEach(t => { if (taskDone[t.id] === undefined) taskDone[t.id] = false; });

  // If a death certificate was uploaded during onboarding, auto-mark the
  // "Obtain certified death certificates" task as already done.
  if (window._certUploaded) {
    const certTask = tasks.find(t => t.name && t.name.toLowerCase().includes('obtain certified death'));
    if (certTask) taskDone[certTask.id] = true;
  }
  // Show the deterministic list immediately, then enrich + complexity-check in background
  setTimeout(renderDash, 300);
  scheduleSave();
  enrichTaskDescriptions(tasks);
  complexityCheck();
}

// Assess the estate for high-risk complexity indicators and add flagged trace events.
// These are specific conditions where automation alone is insufficient.
function complexityCheck() {
  const assets   = A.assets    || [];
  const debts    = A.debts     || [];
  const will     = A.will      || '';
  const state    = A.state     || '';
  const survivors= A.survivors || [];

  const hasRealEstate = assets.some(a => a.includes('Home') || a.includes('real estate'));
  const hasCrypto     = assets.some(a => a.includes('Cryptocurrency'));
  const hasNoWill     = will.includes('No will') || will.includes('Not sure');
  const hasTrust      = will.includes('trust');
  const hasBusiness   = debts.some(d => d.includes('Business'));
  const hasMortgage   = debts.some(d => d.includes('Mortgage'));
  const hasMinorChildren = survivors.some(s => s.includes('Children under 18'));
  const hasDisabledChildren = survivors.some(s => s.includes('disability'));

  const flags = [];

  if (hasNoWill && hasRealEstate) {
    flags.push({
      level: 'high',
      rule: 'State intestacy law + probate code',
      issue: 'No will with real estate: intestate succession determines heirs, but real property still requires formal probate.',
      action: 'Engage an estate attorney before taking any action on the property. Do not transfer title without probate court authorization.',
    });
  }
  if (hasNoWill && !hasRealEstate && assets.length > 2) {
    flags.push({
      level: 'medium',
      rule: 'State intestacy law',
      issue: 'No will: asset distribution follows state intestacy statute, not assumed intent.',
      action: 'Confirm the order of heirs under ' + (state || 'your state') + ' intestacy law before distributing any assets.',
    });
  }
  if (hasCrypto) {
    flags.push({
      level: 'high',
      rule: 'RUFADAA; estate law',
      issue: 'Cryptocurrency with no access credentials results in permanent, unrecoverable loss. This cannot be undone.',
      action: 'STOP — locate private keys, seed phrases, and exchange logins before taking any other action.',
    });
  }
  if (hasBusiness) {
    flags.push({
      level: 'high',
      rule: 'State business law; creditor priority statute',
      issue: 'Business debts involve a separate creditor priority analysis and may require business dissolution or succession proceedings.',
      action: 'Do not pay business debts from personal estate funds without legal advice. Engage a business or estate attorney.',
    });
  }
  if (hasTrust && hasRealEstate && hasMortgage) {
    flags.push({
      level: 'medium',
      rule: 'Garn-St. Germain Act, 12 U.S.C. § 1701j-3; trust law',
      issue: 'Mortgaged real estate held in trust requires lender notification and careful coordination with the trustee.',
      action: 'Notify the mortgage servicer immediately and confirm the trust\'s authority to manage the property before any transfer.',
    });
  }
  if (hasMinorChildren || hasDisabledChildren) {
    flags.push({
      level: 'medium',
      rule: '42 U.S.C. §§ 402(d), 1382c; state guardianship law',
      issue: 'Minor or disabled beneficiaries may require a court-appointed guardian or conservator to receive and manage inherited assets.',
      action: 'Consult with an estate attorney about establishing a guardianship or special needs trust before distributing any assets.',
    });
  }

  if (!flags.length) {
    addTrace('global', 'verify', 'Your checklist is ready',
      'We reviewed the information you shared and built a checklist that covers everything we identified.',
      null, null);
    return;
  }

  flags.forEach(f => {
    addTrace('global',
      f.level === 'high' ? 'warn' : 'step',
      f.level === 'high' ? 'This step needs extra care' : 'Something to keep in mind',
      `${f.issue} ${f.action}`,
      null,
      f.rule
    );
  });
}

// Build a guaranteed, personalized task list from intake data.
// Every item the user reported gets at least one task — nothing is AI-guessed.
function buildIntakeTasks() {
  const list = [];
  let id = 1;
  const state = A.state || 'your state';
  const deceased = A.name || 'the deceased';
  const assets   = A.assets    || [];
  const debts    = A.debts     || [];
  const digital  = A.digital   || [];
  const benefits = A.benefits  || [];
  const survivors= A.survivors || [];
  const discover = A.discover  || [];
  const will     = A.will      || '';

  const add = (category, name, description, urgency, institution) =>
    list.push({ id: id++, category, name, description, urgency, institution });

  // ── ALWAYS REQUIRED ──────────────────────────────────────────
  add('Government and Legal',
    'Obtain certified death certificates',
    `You will need 10 to 15 certified copies. Banks, the probate court, life insurance companies, the DMV, and government agencies all require one. Order through the funeral home or the vital records office in the county where ${deceased} passed away in ${state}.`,
    'immediate', `${state} Vital Records`);

  add('Government and Legal',
    'Notify Social Security Administration',
    `Call 1-800-772-1213 to report the death and stop benefit payments. Any Social Security payment deposited after the date of death must be returned — this is federal law. Do this within a few days.`,
    'immediate', 'Social Security Administration');

  add('Government and Legal',
    'Notify employer HR department',
    `Notify the HR department at ${deceased}'s most recent employer to stop payroll, collect the final paycheck, and ask about group life insurance, any pension plan, accrued vacation payout, and the 401(k). ${state} has specific final paycheck timing requirements for employers.`,
    'immediate', 'Employer HR');

  add('Government and Legal',
    'Place deceased alert with the three credit bureaus',
    `Contact Equifax (1-800-685-1111), Experian (1-888-397-3742), and TransUnion (1-800-916-8800) to place a deceased alert on the credit file. This stops new credit applications and protects against identity theft.`,
    'soon', 'Equifax, Experian, TransUnion');

  add('Government and Legal',
    'File the final federal income tax return',
    `File IRS Form 1040 for ${deceased} for the year of death (due April 15 of the following year, or October 15 with extension). If the estate earns income after death, a separate Form 1041 estate income tax return may also be required.`,
    'later', 'Internal Revenue Service');

  add('Government and Legal',
    `File ${state} final state income tax return`,
    `File the final state income tax return for ${deceased} with the appropriate ${state} revenue department. Check whether ${state} imposes a separate estate or inheritance tax, which has its own filing threshold and deadline.`,
    'later', `${state} Revenue Department`);

  // ── PROBATE ──────────────────────────────────────────────────
  const likelyNeedsProbate = assets.some(a =>
    a.includes('Home') || a.includes('real estate') ||
    a.includes('Investment') || a.includes('brokerage') ||
    a.includes('Bank')
  ) && !will.includes('trust');

  if (likelyNeedsProbate || will.includes('will') || will.includes('No will') || will.includes('Not sure')) {
    add('Government and Legal',
      `File for probate and obtain executor authority in ${state}`,
      `File the will (if one exists) with the probate court in the district or county where ${deceased} was domiciled in ${state}. The court will issue Letters Testamentary (or the equivalent credential in ${state}) giving you legal authority to manage the estate, access accounts, and sign on behalf of the estate.`,
      assets.some(a => a.includes('Home') || a.includes('real estate')) ? 'immediate' : 'soon',
      `${state} Probate Court`);
  }

  // ── FINANCIAL ASSETS ─────────────────────────────────────────
  if (assets.some(a => a.includes('Bank') || a.includes('checking') || a.includes('Savings') || a.includes('money market'))) {
    add('Financial Accounts',
      'Notify banks and transfer or close deposit accounts',
      `Contact the estate services department at each bank or credit union where ${deceased} held accounts. You will need a certified death certificate and Letters Testamentary. The institution will freeze the accounts, provide a balance statement, and begin the estate settlement or beneficiary transfer process. Joint accounts generally transfer to the surviving owner.`,
      'immediate', 'Bank Estate Services');
  }

  if (assets.some(a => a.includes('401') || a.includes('403'))) {
    add('Financial Accounts',
      'Claim 401(k) or 403(b) retirement plan benefits',
      `Contact the plan administrator (usually through the employer HR) for ${deceased}'s retirement plan. Named beneficiaries receive funds directly outside probate. If no beneficiary is named, the funds flow into the estate. The beneficiary has options to roll over, take a lump sum, or take annual distributions depending on their relationship to ${deceased}.`,
      'soon', 'Retirement Plan Administrator');
  }

  if (assets.some(a => a.includes('Roth'))) {
    add('Financial Accounts',
      'Claim Roth IRA benefits',
      `Contact the financial institution holding the Roth IRA. A named spouse beneficiary can roll it into their own Roth IRA. Non-spouse beneficiaries must generally deplete the account within 10 years under the SECURE 2.0 Act. No required minimum distributions apply to Roth IRAs.`,
      'soon', 'Roth IRA Custodian');
  }

  if (assets.some(a => a.includes('Traditional IRA'))) {
    add('Financial Accounts',
      'Claim Traditional IRA benefits',
      `Notify the IRA custodian of ${deceased}'s death. A Required Minimum Distribution must be taken for the year of death if it had not already been taken. Named beneficiaries have 10 years to deplete the account (or can take life-expectancy distributions if they are an eligible designated beneficiary).`,
      'soon', 'IRA Custodian');
  }

  if (assets.some(a => a.includes('Investment') || a.includes('brokerage'))) {
    add('Financial Accounts',
      'Transfer or liquidate investment and brokerage accounts',
      `Contact the brokerage or investment firm holding ${deceased}'s accounts. Bring Letters Testamentary and a death certificate. Accounts with a named TOD (Transfer on Death) beneficiary pass directly. Others require court authorization. Assets receive a stepped-up cost basis as of the date of death, which affects capital gains calculations.`,
      'soon', 'Brokerage Estate Services');
  }

  if (assets.some(a => a.includes('Life insurance'))) {
    add('Financial Accounts',
      'File life insurance death benefit claims',
      `Contact each life insurance company to file a death claim. You will need a certified death certificate and the policy number. Life insurance proceeds paid to named beneficiaries are not subject to probate and are generally income-tax-free to the recipient.`,
      'soon', 'Life Insurance Company');
  }

  if (assets.some(a => a.includes('Cryptocurrency') || a.includes('digital assets'))) {
    add('Financial Accounts',
      'Secure and transfer cryptocurrency and digital assets',
      `Act immediately to prevent permanent loss. Locate private keys, seed phrases, hardware wallets, and exchange account credentials. Crypto passes outside of probate but requires access credentials. Contact each exchange with a death certificate to initiate transfer. Document every wallet address and balance.`,
      'immediate', 'Cryptocurrency Exchanges / Wallets');
  }

  // ── PROPERTY ─────────────────────────────────────────────────
  if (assets.some(a => a.includes('Home') || a.includes('real estate'))) {
    add('Property and Insurance',
      `Transfer or probate real property in ${state}`,
      `Real estate titled solely in ${deceased}'s name must pass through the ${state} probate process. If held in joint tenancy, the surviving owner files a certified copy of the death certificate with the ${state} Registry of Deeds (or equivalent). If held in a trust, the trustee transfers title per the trust terms. An estate attorney is strongly recommended.`,
      'soon', `${state} Probate Court / Registry of Deeds`);

    add('Property and Insurance',
      'Notify homeowners insurance and maintain coverage',
      `Notify the homeowners insurance carrier immediately. An unoccupied home can lose standard coverage within 30 to 60 days. Request a vacancy or estate endorsement to maintain coverage while the estate is settled. Failure to notify could void any future claim.`,
      'immediate', 'Homeowners Insurance');
  }

  if (assets.some(a => a.includes('Vehicle'))) {
    add('Property and Insurance',
      `Transfer vehicle title through the ${state} DMV`,
      `To transfer a vehicle title in ${state}, bring the original title, a certified death certificate, and Letters Testamentary to the ${state} DMV. If the vehicle was jointly titled with right of survivorship, the surviving owner can typically transfer with just a death certificate and an affidavit.`,
      'later', `${state} DMV`);
  }

  // ── DEBTS ─────────────────────────────────────────────────────
  if (debts.some(d => d.includes('Mortgage'))) {
    add('Financial Accounts',
      'Notify mortgage servicer',
      `Contact the mortgage servicer as soon as possible. Payments must continue to avoid default or foreclosure. If the property is being sold or transferred through probate, the servicer needs to be notified and included in the process. Ask about any assumption, payoff, or short-sale options.`,
      'immediate', 'Mortgage Servicer');
  }

  if (debts.some(d => d.includes('Car loan'))) {
    add('Financial Accounts',
      'Notify auto lender',
      `Notify the auto lender of ${deceased}'s death. The estate is responsible for ongoing payments. If the vehicle is being sold, transferred, or surrendered, the lender must be paid off first from the sale proceeds.`,
      'soon', 'Auto Lender');
  }

  if (debts.some(d => d.includes('Credit card'))) {
    add('Financial Accounts',
      'Cancel credit cards and settle outstanding balances',
      `Notify each credit card issuer of ${deceased}'s death and request account closure. The estate is responsible for any outstanding balances — these are unsecured debts and are typically paid after secured creditors. Do not use the cards after death. Authorized users must stop using them immediately.`,
      'soon', 'Credit Card Issuers');
  }

  if (debts.some(d => d.includes('Student loans'))) {
    add('Financial Accounts',
      'Resolve student loan obligations',
      `Federal student loans are automatically discharged upon the borrower's death — submit a death certificate to the servicer. Private student loans vary: some discharge upon death, others may make a claim against the estate. Check each loan agreement and contact each servicer directly.`,
      'soon', 'Student Loan Servicer');
  }

  if (debts.some(d => d.includes('Medical bills'))) {
    add('Financial Accounts',
      'Settle outstanding medical bills',
      `The estate is responsible for medical bills incurred before death. Request itemized statements from each provider. Medical debts are unsecured and paid after secured debts and administrative expenses in the creditor payment priority order. Negotiate directly with providers if the estate is limited.`,
      'later', 'Medical Providers');
  }

  if (debts.some(d => d.includes('Personal loans') || d.includes('Business debts'))) {
    add('Financial Accounts',
      'Settle personal and business loan obligations',
      `Identify all personal and business loans in ${deceased}'s name. Notify each lender and determine whether the estate or any co-signers are liable. Business debts may require a separate process depending on how the business was structured.`,
      'soon', 'Lenders / Creditors');
  }

  // ── DIGITAL ──────────────────────────────────────────────────
  if (digital.some(d => d.includes('Netflix') || d.includes('Hulu') || d.includes('streaming'))) {
    add('Digital and Subscriptions',
      'Cancel streaming and subscription services',
      `Cancel Netflix, Hulu, Disney+, and any other active streaming services to stop recurring charges. Call each service's support line and mention it is a bereavement account closure. Most cancel same-day and may refund the current billing period.`,
      'soon', 'Streaming Services');
  }

  if (digital.some(d => d.includes('Amazon') || d.includes('Prime'))) {
    add('Digital and Subscriptions',
      'Close Amazon account and cancel Prime membership',
      `Call Amazon at 1-888-280-4331 or contact chat support. Mention you are closing an account due to a death. They will cancel Prime, any active subscriptions (Kindle Unlimited, Audible, etc.), and process account closure. Check for any pending orders or gift card balances first.`,
      'soon', 'Amazon');
  }

  if (digital.some(d => d.includes('Facebook') || d.includes('Instagram'))) {
    add('Digital and Subscriptions',
      'Memorialize or remove Facebook and Instagram accounts',
      `Submit a special request to Meta to either memorialize the accounts (keeps profile as a memorial space) or remove them entirely. You will need to provide a death certificate. Visit facebook.com/help/contact/228813257197480 for the removal or memorialization request form.`,
      'later', 'Meta (Facebook / Instagram)');
  }

  if (digital.some(d => d.includes('Apple') || d.includes('iCloud'))) {
    add('Digital and Subscriptions',
      'Close or transfer Apple ID and iCloud account',
      `Call Apple Support at 1-800-275-2273 with a death certificate. Apple offers a Digital Legacy program where a designated person can request access to account data. All paid subscriptions (iCloud storage, Apple Music, Apple TV+) will be canceled upon account closure.`,
      'later', 'Apple');
  }

  if (digital.some(d => d.includes('Google'))) {
    add('Digital and Subscriptions',
      'Close or memorialize Google account',
      `Submit a request through Google's deceased user process at support.google.com/accounts/troubleshooter/6357590. You can request access to account data or ask for the account to be closed. This covers Gmail, Google Photos, Google Drive, and any Google One or YouTube Premium subscriptions.`,
      'later', 'Google');
  }

  if (digital.some(d => d.includes('LinkedIn'))) {
    add('Digital and Subscriptions',
      'Remove or memorialize LinkedIn profile',
      `Submit a deceased member request at linkedin.com/help to remove the profile or have it memorialized. Cancel any active LinkedIn Premium subscription to stop billing.`,
      'later', 'LinkedIn');
  }

  if (digital.some(d => d.includes('Email'))) {
    add('Digital and Subscriptions',
      'Close or archive email accounts',
      `Before closing email accounts, check for important financial, legal, or subscription confirmation emails. Set up an out-of-office reply so senders know to contact the estate. Then submit a closure request to each email provider (Gmail, Outlook, Yahoo, etc.).`,
      'later', 'Email Provider');
  }

  if (digital.some(d => d.includes('Other subscriptions'))) {
    add('Digital and Subscriptions',
      'Cancel remaining online subscriptions',
      `Review bank and credit card statements for recurring charges that indicate active subscriptions. Cancel each service individually by logging in or calling support. Common ones include news sites, software subscriptions, cloud storage, and membership services.`,
      'soon', 'Various Subscription Services');
  }

  // ── BENEFITS BEING RECEIVED ───────────────────────────────────
  if (benefits.some(b => b.includes('Social Security'))) {
    add('Notifications',
      'Stop Social Security benefit payments',
      `Report the death to SSA at 1-800-772-1213 to halt monthly payments. Any payment received after the month of death must be returned. If payments are by direct deposit, notify the bank not to accept further SSA deposits.`,
      'immediate', 'Social Security Administration');
  }

  if (benefits.some(b => b.includes('Veterans') || b.includes('VA'))) {
    add('Notifications',
      'Stop VA benefit payments and file burial claim',
      `Call the VA at 1-800-827-1000 to report the death and stop benefit payments. File VA Form 21P-530EZ for burial benefits (up to $2,000 if service-connected death, or $796 for non-service-connected). A free grave marker and American flag are also available.`,
      'immediate', 'Department of Veterans Affairs');
  }

  if (benefits.some(b => b.includes('Medicare') || b.includes('Medicaid'))) {
    add('Notifications',
      'Notify Medicare and Medicaid',
      `Notify Medicare by calling 1-800-633-4227. If ${deceased} received Medicaid, the ${state} Medicaid agency may file an estate recovery claim for the cost of benefits paid — this is standard and must be factored into estate distribution. Contact the ${state} Medicaid office to confirm any recovery amount.`,
      'soon', `Medicare / ${state} Medicaid`);
  }

  if (benefits.some(b => b.includes('Pension'))) {
    add('Notifications',
      'Notify pension administrator and claim survivor benefits',
      `Contact the pension plan administrator to stop payments and determine survivor benefit options. Named beneficiaries or surviving spouses may be entitled to continued monthly payments or a lump-sum death benefit depending on the plan terms.`,
      'soon', 'Pension Plan Administrator');
  }

  if (benefits.some(b => b.includes('Workers compensation'))) {
    add('Notifications',
      'Notify workers compensation insurer',
      `If ${deceased} was receiving workers compensation, notify the insurer or the ${state} workers compensation board. Surviving dependents may be entitled to death benefits under ${state} workers comp law.`,
      'soon', `${state} Workers Compensation`);
  }

  // ── SURVIVOR BENEFITS ────────────────────────────────────────
  if (survivors.some(s => s.includes('Spouse'))) {
    add('Survivor Benefits',
      'Apply for Social Security spousal survivor benefits',
      `A surviving spouse may receive monthly payments based on ${deceased}'s earnings record. A one-time $255 lump-sum death payment may also be available. Apply by calling 1-800-772-1213 or visiting a local SSA office. Benefits can begin as early as age 60 for a surviving spouse.`,
      'soon', 'Social Security Administration');
  }

  if (survivors.some(s => s.includes('Children under 18'))) {
    add('Survivor Benefits',
      'Apply for Social Security child survivor benefits',
      `Children under 18 (or under 19 if still in high school) may receive monthly payments based on ${deceased}'s earnings record. Bring birth certificates for each qualifying child. Benefits can be retroactive to the month of death.`,
      'soon', 'Social Security Administration');
  }

  if (survivors.some(s => s.includes('Children with a disability'))) {
    add('Survivor Benefits',
      'Apply for SSI and survivor benefits for disabled adult children',
      `A disabled adult child of ${deceased} may qualify for both SSA survivor benefits and Supplemental Security Income. Contact SSA at 1-800-772-1213 and provide medical documentation of the disability.`,
      'soon', 'Social Security Administration');
  }

  if (survivors.some(s => s.includes('Spouse') || s.includes('Children'))) {
    add('Survivor Benefits',
      'Elect COBRA health continuation coverage for dependents',
      `Surviving dependents who were covered under ${deceased}'s employer health plan have exactly 60 days to elect COBRA continuation coverage. Missing this window permanently forfeits coverage. Contact the employer HR department or health insurance carrier immediately.`,
      'immediate', 'Employer HR / Health Insurer');
  }

  if (survivors.some(s => s.includes('Dependent parents'))) {
    add('Survivor Benefits',
      'Check SSA survivor benefits for dependent parents',
      `A dependent parent who relied on ${deceased} for at least half of their financial support may qualify for SSA survivor benefits. Apply at 1-800-772-1213. Both parents can receive benefits if both were financially dependent.`,
      'soon', 'Social Security Administration');
  }

  // ── DISCOVERY ITEMS ──────────────────────────────────────────
  if (discover.some(d => d.includes('Safe deposit'))) {
    add('Government and Legal',
      'Access and inventory the safe deposit box',
      `Access to a safe deposit box titled solely in ${deceased}'s name typically requires a court order or Letters Testamentary. Contact the bank to arrange supervised access. Inventory all contents in writing in the presence of a witness. Original wills, deeds, and insurance policies may be inside.`,
      'soon', 'Bank / Probate Court');
  }

  if (discover.some(d => d.includes('Military') || d.includes('veteran'))) {
    add('Survivor Benefits',
      'Locate and claim all military and veteran benefits',
      `Request a full benefits review from the VA at 1-800-827-1000. Benefits may include DIC (Dependency and Indemnity Compensation) for surviving spouses, Chapter 35 education benefits, burial benefits, and more. Request ${deceased}'s military service records through the National Archives at archives.gov/veterans.`,
      'soon', 'Department of Veterans Affairs');
  }

  if (discover.some(d => d.includes('Old employer'))) {
    add('Financial Accounts',
      'Locate old employer pension and unclaimed retirement accounts',
      `Search the Department of Labor's Abandoned Plan Database at abandoned401k.dol.gov. Check the Pension Benefit Guaranty Corporation at pbgc.gov for any unclaimed pension. Contact former employers directly with ${deceased}'s Social Security number to inquire about any vested benefits.`,
      'later', 'Former Employers / PBGC');
  }

  if (discover.some(d => d.includes('Storage rental'))) {
    add('Property and Insurance',
      'Handle storage unit rental',
      `Notify the storage facility of ${deceased}'s death immediately. Payments must continue to avoid auction of the contents. Bring Letters Testamentary to gain authorized access. If the unit is not needed, empty and close it as soon as possible to stop recurring charges.`,
      'soon', 'Storage Facility');
  }

  if (discover.some(d => d.includes('Oil') || d.includes('gas') || d.includes('mineral') || d.includes('royalties'))) {
    add('Property and Insurance',
      'Transfer oil, gas, and mineral royalty interests',
      `Royalty interests are considered real property and must be transferred through the ${state} probate process or via a deed of distribution. Contact the royalty-paying operator with a death certificate and Letters Testamentary. You may also need to update the Division Order with each operator.`,
      'later', 'Mineral Rights Operator');
  }

  return list;
}

// ── AI STATE-SPECIFIC ENRICHMENT ──
// Runs in the background after deterministic tasks are already shown.
// Appends a short state-specific note to each Government/Legal/Property/Survivor task.
async function enrichTaskDescriptions(taskList) {
  if (!A.state) return;
  const state = A.state;
  const toEnrich = taskList.filter(t =>
    t.category === 'Government and Legal' ||
    t.category === 'Property and Insurance' ||
    t.category === 'Survivor Benefits'
  ).slice(0, 14);
  if (!toEnrich.length) return;

  const prompt = `An executor in ${state} needs state-specific guidance. For each task below, write 1-2 sentences naming the actual ${state} court, agency, form number, or filing deadline where applicable. Be concrete and specific to ${state} — do NOT use placeholders like "your state's court." Respond ONLY with a valid JSON array: [{id, stateNote}]. No markdown, no extra text.

${toEnrich.map(t => `id ${t.id}: ${t.name}`).join('\n')}`;

  try {
    const r = await anthropicFetch({
      model: 'claude-sonnet-4-20250514', max_tokens: 1200,
      system: `You are a ${state} estate law specialist. Name real ${state} courts, agencies, forms, and deadlines. No em dashes. No mention of AI.`,
      messages: [{ role: 'user', content: prompt }]
    });
    const d = await r.json();
    const txt = d.content[0].text;
    let notes;
    try { notes = JSON.parse(txt); }
    catch (e) { const m = txt.match(/\[[\s\S]*\]/); notes = m ? JSON.parse(m[0]) : null; }
    if (!notes) return;

    notes.forEach(({ id, stateNote }) => {
      const t = tasks.find(t => String(t.id) === String(id));
      if (t && stateNote) {
        t.description = t.description.trimEnd() + ' ' + stateNote;
        t.aiEnriched = true;
        // Log to trace so the audit trail shows exactly which task received AI enrichment
        addTrace(String(t.id), 'step', `Guidance added for ${state}`,
          `We've added information specific to ${state} for this task. Please check the details against the official sources listed — this is guidance, not legal advice.`,
          null, null);
      }
    });

    // Refresh workflow panel if the selected task was just enriched
    if (selTask && notes.some(n => String(n.id) === String(selTask.id))) {
      selTask = tasks.find(t => String(t.id) === String(selTask.id)) || selTask;
      renderWorkflow(selTask);
    }
    scheduleSave();
  } catch (e) {
    // Enrichment is optional — log failure so trace shows it was attempted
    addTrace('global', 'warn', 'Could not add state-specific guidance',
      'We were not able to add additional guidance for your state right now. Your checklist is still complete — the tasks are based on what you shared during setup. You can always ask in the chat for state-specific questions.',
      null, null);
  }
}

// ── PROBATE NECESSITY LOGIC ──
function needsProbate() {
  const assets = A.assets || [];
  const will = A.will || '';
  const hasRealEstate = assets.includes('Home or real estate');
  const hasTrust = will.includes('trust');
  const hasNoEstatePlan = will.includes('No will') || will.includes('Not sure');
  const hasBeneficiaryAssets = assets.some(a => a.includes('401') || a.includes('IRA') || a.includes('Roth') || a.includes('Life insurance'));
  const hasBankOnly = assets.length > 0 && assets.every(a => a.includes('Bank') || a.includes('Savings') || a.includes('Vehicle') || a.includes('Crypto'));
  if (hasTrust && !hasRealEstate) return 'unlikely';
  if (hasRealEstate && !hasTrust) return 'likely';
  if (hasNoEstatePlan && assets.length > 0) return 'likely';
  if (hasBeneficiaryAssets && !hasRealEstate && hasTrust) return 'unlikely';
  if (hasBankOnly) return 'maybe';
  return 'unknown';
}

// ── TASK FILTER ──
function shouldShow(t) {
  const n = (t.name || '').toLowerCase();
  const assets = A.assets || [], benefits = A.benefits || [], digital = A.digital || [], survivors = A.survivors || [], debts = A.debts || [];
  if (n.includes('life insurance') && !assets.some(a => a.includes('Life insurance'))) return false;
  if ((n.includes('401') || n.includes('403')) && !assets.some(a => a.includes('401') || a.includes('403'))) return false;
  if (n.includes('roth') && !assets.some(a => a.includes('Roth'))) return false;
  if (n.includes('traditional ira') && !assets.some(a => a.includes('Traditional IRA'))) return false;
  if ((n.includes('brokerage') || n.includes('investment account')) && !assets.some(a => a.includes('Investment') || a.includes('brokerage'))) return false;
  if ((n.includes('vehicle') || n.includes('dmv') || n.includes('car title')) && !assets.includes('Vehicle')) return false;
  if ((n.includes('real estate') || n.includes('property transfer')) && !assets.includes('Home or real estate')) return false;
  if ((n.includes('crypto') || n.includes('bitcoin')) && !assets.includes('Cryptocurrency or digital assets')) return false;
  if ((n.includes('veteran') || n.includes('va pension') || n.includes('burial allow') || n.includes('dic')) && !benefits.includes('Veterans benefits (VA)')) return false;
  if ((n.includes('medicare') || n.includes('medicaid')) && !benefits.includes('Medicare or Medicaid')) return false;
  if (n.includes('workers comp') && !benefits.includes('Workers compensation')) return false;
  if ((n.includes('facebook') || n.includes('instagram')) && !digital.some(d => d.includes('Facebook'))) return false;
  if ((n.includes('icloud') || n.includes('apple id')) && !digital.some(d => d.includes('Apple'))) return false;
  if ((n.includes('google') || n.includes('gmail')) && !digital.some(d => d.includes('Google'))) return false;
  if ((n.includes('netflix') || n.includes('hulu') || n.includes('streaming')) && !digital.some(d => d.includes('Netflix') || d.includes('streaming'))) return false;
  if ((n.includes('amazon') || n.includes('prime')) && !digital.some(d => d.includes('Amazon'))) return false;
  if (n.includes('linkedin') && !digital.some(d => d.includes('LinkedIn'))) return false;
  if ((n.includes('surviving spouse') || n.includes('widow survivor')) && !survivors.some(s => s.includes('Spouse'))) return false;
  if ((n.includes('child survivor') || n.includes('minor child benefit')) && !survivors.some(s => s.includes('Children under 18'))) return false;
  if ((n.includes('credit card') || n.includes('settle balance')) && !debts.some(d => d.includes('Credit card'))) return false;
  if ((n.includes('mortgage') || n.includes('home loan')) && !debts.some(d => d.includes('Mortgage'))) return false;
  if (n.includes('student loan') && !debts.some(d => d.includes('Student'))) return false;
  if (n.includes('medical bill') && !debts.some(d => d.includes('Medical'))) return false;
  if (n.includes('probate')) {
    const p = needsProbate();
    if (p === 'unlikely') return false;
    if (p === 'maybe' || p === 'unknown') {
      t.description = p === 'maybe'
        ? 'Probate may not be required — most assets appear to pass by beneficiary designation or joint ownership. Confirm with the financial institutions first. If any accounts have no named beneficiary, probate may still be needed.'
        : 'We cannot determine from the information provided whether probate is required. This depends on how assets are titled and whether named beneficiaries are current. We recommend a brief consultation with a local estate attorney to confirm.';
      t.urgency = 'soon';
    }
  }
  return true;
}

// ── DASHBOARD ──
const ICONS = { 'Government and Legal': '🏛', 'Financial Accounts': '🏦', 'Property and Insurance': '🏠', 'Digital and Subscriptions': '📱', 'Notifications': '✉️', 'Survivor Benefits': '💛' };
const CAT_ORDER = ['Government and Legal', 'Financial Accounts', 'Property and Insurance', 'Digital and Subscriptions', 'Notifications', 'Survivor Benefits'];

function renderDash() {
  go('s-dashboard');
  tasks = tasks.filter(shouldShow);
  document.getElementById('dname').textContent = A.name || 'the Estate';
  document.getElementById('dmeta').textContent = `${A.state || ''} · ${A.rel || ''} · ${tasks.length} tasks`;
  updProg();
  const cats = {};
  tasks.forEach(t => { if (!cats[t.category]) cats[t.category] = []; cats[t.category].push(t); });
  const uo = { immediate: 0, soon: 1, later: 2 };
  Object.values(cats).forEach(a => a.sort((a, b) => (uo[a.urgency] || 1) - (uo[b.urgency] || 1)));
  const sorted = Object.entries(cats).sort(([a], [b]) => { const ai = CAT_ORDER.indexOf(a), bi = CAT_ORDER.indexOf(b); return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi); });
  document.getElementById('tcol').innerHTML = sorted.map(([c, ts]) => `
    <div class="cat-sec">
      <div class="cat-hdr"><span class="cat-icon">${ICONS[c] || '📋'}</span><span class="cat-name">${c}</span><span class="cat-count">${ts.length}</span></div>
      <div class="tasks">${ts.map(t => {
        const isDone = taskDone[t.id];
        const urgCls = t.urgency === 'immediate' ? 'now' : t.urgency === 'soon' ? 'soon' : 'later';
        const urgLabel = t.urgency === 'immediate' ? 'Do first' : t.urgency === 'soon' ? 'Soon' : 'Later';
        const dh = depHintFor(t);
        return `<div class="ti${selTask && String(selTask.id) === String(t.id) ? ' sel' : ''}" id="ti${t.id}" onclick="selT('${t.id}')">
          <div class="ti-chk${isDone ? ' done' : ''}" id="chk${t.id}" onclick="event.stopPropagation();togDone('${t.id}')">${isDone ? '✓' : ''}</div>
          <div class="ti-body">
            <div class="ti-name${isDone ? ' done' : ''}">${t.name}</div>
            <div class="ti-sub">${t.institution || ''}${dh ? ' · <span style="color:var(--amber)">' + dh + '</span>' : ''}</div>
          </div>
          <div class="urg ${urgCls}">${urgLabel}</div>
        </div>`;
      }).join('')}</div>
    </div>`).join('') + `<div style="padding:12px 18px 18px;border-top:1px solid var(--border)"><button type="button" class="sa-btn" onclick="addCustomTask()">+ Add custom task</button></div>`;
}

function addCustomTask() {
  const name = prompt('Name for this task'); if (!name || !name.trim()) return;
  window._customTaskSeq = (window._customTaskSeq || 0) + 1;
  const id = 'custom-' + window._customTaskSeq;
  const o = { id, category: 'Custom', name: name.trim(), description: 'Custom task', urgency: 'soon', institution: '' };
  customTasks.push(o); tasks.push(o); taskDone[id] = false;
  renderDash(); scheduleSave();
}

function togDone(id) {
  taskDone[id] = !taskDone[id];
  const chk = document.getElementById('chk' + id), nm = document.getElementById('ti' + id)?.querySelector('.ti-name');
  if (chk) { chk.classList.toggle('done', taskDone[id]); chk.textContent = taskDone[id] ? '✓' : ''; }
  if (nm) nm.classList.toggle('done', taskDone[id]);
  updProg();
  if (selTask && String(selTask.id) === String(id)) renderWorkflow(selTask);
  scheduleSave();
}

function updProg() {
  const total = tasks.length, comp = tasks.filter(t => taskDone[t.id]).length;
  const p = total ? Math.round(comp / total * 100) : 0;
  document.getElementById('pfill').style.width = p + '%';
  document.getElementById('plbl').textContent = `${comp} of ${total} complete`;
}

function selT(id) {
  selTask = tasks.find(t => String(t.id) === String(id));
  document.querySelectorAll('.ti').forEach(el => el.classList.remove('sel'));
  const el = document.getElementById('ti' + id);
  if (el) el.classList.add('sel');
  renderWorkflow(selTask);
  updateChatContext(selTask);
  // Log task opening to trace so the audit trail records when each task was reviewed
  if (selTask && (!traceEvents[id] || !traceEvents[id].length)) {
    const basis = selTask.legalBasis || getLegalBasis(selTask);
    addTrace(id, 'step', 'You opened this task',
      `"${selTask.name}" — ${selTask.urgency === 'immediate' ? 'This one is time-sensitive.' : selTask.urgency === 'soon' ? 'Try to get to this one within the next few weeks.' : 'This one can wait a little longer.'}`,
      null, basis.length ? basis.map(b => b.cite).join('; ') : null);
  }
}

// ── TRACKER ──
function renderTracker() {
  const o = document.getElementById('tr-ord'), h = document.getElementById('tr-hand'), m = document.getElementById('tr-mail'), n = document.getElementById('tr-note');
  if (o) o.value = trackerState.certOrdered || 0;
  if (h) h.value = trackerState.certOnHand || 0;
  if (m) m.value = trackerState.certMailed || 0;
  if (n) n.value = trackerState.certNote || '';
  trRenderRows(); trDeadlines();
}

function trUpd() {
  trackerState.certOrdered = Number(document.getElementById('tr-ord')?.value) || 0;
  trackerState.certOnHand = Number(document.getElementById('tr-hand')?.value) || 0;
  trackerState.certMailed = Number(document.getElementById('tr-mail')?.value) || 0;
  trackerState.certNote = document.getElementById('tr-note')?.value || '';
  scheduleSave(); trDeadlines();
}

function trRenderRows() {
  const el = document.getElementById('tr-resp-rows');
  if (!el) return;
  if (!trackerState.responses) trackerState.responses = [];
  el.innerHTML = trackerState.responses.map((r, i) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)">
    <input class="field-inp" placeholder="Institution" value="${(r.institution || '').replace(/"/g, '&quot;')}" oninput="trRow(${i},'institution',this.value)"/>
    <input class="field-inp" placeholder="Sent date" value="${(r.sentDate || '').replace(/"/g, '&quot;')}" oninput="trRow(${i},'sentDate',this.value)"/>
    <input class="field-inp" placeholder="Channel (email, mail…)" value="${(r.channel || '').replace(/"/g, '&quot;')}" oninput="trRow(${i},'channel',this.value)"/>
    <select class="field-inp" onchange="trRow(${i},'response',this.value)">
      <option value="pending" ${r.response === 'pending' ? 'selected' : ''}>Pending</option>
      <option value="yes" ${r.response === 'yes' ? 'selected' : ''}>Response received</option>
      <option value="no" ${r.response === 'no' ? 'selected' : ''}>No response yet</option>
    </select>
  </div>`).join('') || '<div style="font-size:12px;color:var(--text3)">No rows yet.</div>';
}

function trRow(i, k, v) { if (!trackerState.responses[i]) return; trackerState.responses[i][k] = v; scheduleSave(); }
function trAddRow() { if (!trackerState.responses) trackerState.responses = []; trackerState.responses.push({ institution: '', sentDate: '', channel: '', response: 'pending' }); trRenderRows(); scheduleSave(); }

function trDeadlines() {
  const el = document.getElementById('tr-deadlines');
  if (!el) return;
  const lines = [];
  if (A.dateOfDeath || trackerState.dateOfDeath) lines.push('Return SSA payments after date of death as instructed (often within 60 days).', 'Employer COBRA election: often within 60 days.');
  else lines.push('Add date of death under document upload for SSA and COBRA deadline hints.');
  el.innerHTML = lines.map(l => `<div style="margin-bottom:6px">› ${l}</div>`).join('');
}

function exportTrackerPdf() {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Passage tracker</title></head><body style="font-family:system-ui,sans-serif;padding:24px;line-height:1.5"><h1>Passage tracker</h1><h2>Certified copies</h2><p>Ordered: ${trackerState.certOrdered || 0}, on hand: ${trackerState.certOnHand || 0}, mailed: ${trackerState.certMailed || 0}</p><p>${trackerState.certNote || ''}</p><h2>Institution log</h2><pre style="white-space:pre-wrap">${JSON.stringify(trackerState.responses || [], null, 2)}</pre></body></html>`);
  w.document.close(); w.focus(); w.print();
}

// ── FALLBACK TASK LIST (used when API is unavailable) ──
function fallback() {
  return [
    { id: 'f0', category: 'Government and Legal', name: 'Obtain certified death certificates', description: 'You will need 10 to 15 certified copies. Almost every step on this checklist requires one.', urgency: 'immediate', institution: 'County Vital Records' },
    { id: 'f1', category: 'Government and Legal', name: 'Report the death to Social Security', description: 'Call 1-800-772-1213 to stop benefit payments and ask about survivor benefits.', urgency: 'immediate', institution: 'Social Security Administration' },
    { id: 'f2', category: 'Government and Legal', name: 'File for probate if required', description: 'Required if the estate includes real property or accounts without named beneficiaries.', urgency: 'immediate', institution: 'Probate Court' },
    { id: 'f3', category: 'Government and Legal', name: 'Notify the three credit bureaus', description: 'Contact Equifax, Experian, and TransUnion to place a deceased alert and prevent fraud.', urgency: 'soon', institution: 'Credit Bureaus' },
    { id: 'f4', category: 'Financial Accounts', name: 'Notify financial accounts and institutions', description: 'Notify each bank, investment account, and retirement account.', urgency: 'immediate', institution: 'Banks and Financial Institutions' },
    { id: 'f5', category: 'Financial Accounts', name: 'Claim life insurance policies', description: 'Contact each insurer to file a death claim.', urgency: 'soon', institution: 'Life Insurance Companies' },
    { id: 'f6', category: 'Financial Accounts', name: 'Cancel credit cards and settle balances', description: 'Notify each credit card company. The estate is responsible for outstanding balances.', urgency: 'soon', institution: 'Credit Card Companies' },
    { id: 'f7', category: 'Property and Insurance', name: 'Notify homeowners or renters insurance', description: 'Update or transfer the policy. An unoccupied home may lose coverage within 30 to 60 days.', urgency: 'immediate', institution: 'Homeowners Insurance' },
    { id: 'f8', category: 'Digital and Subscriptions', name: 'Cancel streaming and online subscriptions', description: 'Cancel all active subscriptions to stop ongoing charges.', urgency: 'soon', institution: 'Streaming Services' },
    { id: 'f9', category: 'Notifications', name: 'Notify the employer and HR department', description: 'Stop payroll, collect final paycheck, and ask about life insurance, pension, and COBRA.', urgency: 'immediate', institution: 'Employer HR' },
    { id: 'f10', category: 'Government and Legal', name: 'File the final tax returns', description: 'File Form 1040 for the year of death. An estate income return may also be required.', urgency: 'later', institution: 'Internal Revenue Service' },
    { id: 'f11', category: 'Survivor Benefits', name: 'Apply for Social Security survivor benefits', description: 'A surviving spouse and children under 18 may qualify for monthly payments. A one-time $255 payment may also be available.', urgency: 'soon', institution: 'Social Security Administration' },
    { id: 'f12', category: 'Survivor Benefits', name: 'Claim employer group life insurance and COBRA', description: 'Contact HR for group life insurance and ensure dependents can elect COBRA health coverage within 60 days.', urgency: 'immediate', institution: 'Employer HR' },
  ];
}
