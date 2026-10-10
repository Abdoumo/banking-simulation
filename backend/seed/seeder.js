/**
 * ═══════════════════════════════════════════════════════════════
 *  RISKVISION — Massive Data Seeder (10,000+ Clients)
 * ═══════════════════════════════════════════════════════════════
 *
 *  Generates realistic banking data:
 *    • 10,000+ clients (Particulier, Professionnel, PME)
 *    • KYC: 70% Verified, 20% Pending, 10% Rejected
 *    • Multiple accounts with varied balances
 *    • Credits with on-time payments, missed payments, defaults
 *    • 50,000+ historical transactions across channels
 *
 *  Run:  node seed/seeder.js
 * ═══════════════════════════════════════════════════════════════
 */

const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const { sequelize, Client, KycDetail, Account, Transaction, Credit } = require('../models');

// ── Configuration ────────────────────────────────────────────
const TOTAL_CLIENTS = 10500;
const BATCH_SIZE = 500;
const PASSWORD_HASH = bcrypt.hashSync('password123', 10); // Shared hash for all seeded users

const PROFESSIONS = [
  'Ingénieur', 'Médecin', 'Avocat', 'Enseignant', 'Commerçant',
  'Pharmacien', 'Architecte', 'Comptable', 'Informaticien', 'Journaliste',
  'Agriculteur', 'Artisan', 'Chauffeur', 'Fonctionnaire', 'Chef d\'entreprise',
  'Dentiste', 'Électricien', 'Plombier', 'Mécanicien', 'Restaurateur',
  'Directeur Commercial', 'Gérant de société', 'Consultant', 'Freelance',
];

const WILAYAS = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif',
  'Tlemcen', 'Béjaïa', 'Tizi Ouzou', 'Djelfa', 'Biskra', 'Médéa',
  'Mostaganem', 'Skikda', 'Chlef', 'Jijel', 'Ghardaïa', 'Ouargla', 'Tipaza',
];

const CHANNELS = ['Web', 'Mobile', 'ATM', 'Agence'];
const TX_TYPES = ['Virement', 'Depot', 'Retrait', 'Paiement', 'Paiement TPE', 'Prelevement'];
const CREDIT_TYPES = ['Credit Immobilier', 'Credit Consommation', 'Credit Auto', 'Credit Professionnel'];

// ── Helpers ──────────────────────────────────────────────────
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateAccountNumber(devise, index) {
  const prefix = devise === 'EUR' ? '200' : devise === 'USD' ? '300' : '100';
  return `${prefix}${String(index).padStart(10, '0')}`;
}

function randomIP() {
  return `${randomBetween(10, 223)}.${randomBetween(0, 255)}.${randomBetween(0, 255)}.${randomBetween(1, 254)}`;
}

function randomDate(startYear = 2020, endYear = 2026) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 9, 1).getTime();
  return new Date(start + Math.random() * (end - start));
}

// ── Main Seed Function ───────────────────────────────────────
async function seed() {
  console.log('═══════════════════════════════════════════════════');
  console.log(' 🌱 RISKVISION SEEDER — Starting...');
  console.log('═══════════════════════════════════════════════════');

  // Drop and recreate all tables
  await sequelize.sync({ force: true });
  console.log('✅ Tables recreated\n');

  // ────────────────────────────────────────────────────────────
  //  PHASE 1: Generate Clients + KYC
  // ────────────────────────────────────────────────────────────
  console.log(`📋 Phase 1: Creating ${TOTAL_CLIENTS} clients...`);

  let accountIndex = 0;
  const allAccounts = []; // Track for transaction generation

  for (let batch = 0; batch < Math.ceil(TOTAL_CLIENTS / BATCH_SIZE); batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_CLIENTS);
    const batchSize = batchEnd - batchStart;

    const clientRows = [];
    const kycRows = [];
    const accountRows = [];
    const creditRows = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const clientId = i + 1;

      // ── Client Type Distribution ───────────────────────
      let type_client;
      const typeRoll = Math.random();
      if (typeRoll < 0.65) type_client = 'Particulier';
      else if (typeRoll < 0.85) type_client = 'Professionnel';
      else type_client = 'PME/Entreprise';

      const nom = faker.person.lastName();
      const prenom = faker.person.firstName();
      const dateCreation = randomDate(2018, 2026);

      clientRows.push({
        client_id: clientId,
        nom,
        prenom,
        email: `client${clientId}@riskvision.dz`,
        password_hash: PASSWORD_HASH,
        type_client,
        telephone: `0${randomBetween(5, 7)}${String(randomBetween(10000000, 99999999))}`,
        date_naissance: faker.date.between({ from: '1955-01-01', to: '2000-12-31' }),
        is_admin: clientId <= 3, // First 3 clients are admins
        date_creation: dateCreation,
      });

      // ── KYC Distribution: 70% Verified, 20% Pending, 10% Rejected ──
      const kycRoll = Math.random();
      let kyc_status, docId, docDom, docRev, docUbo, rejReason = null, dateVerif = null;

      if (kycRoll < 0.70) {
        kyc_status = 'Verified';
        docId = true;
        docDom = true;
        docRev = true;
        docUbo = type_client === 'PME/Entreprise' ? true : (Math.random() > 0.3);
        dateVerif = new Date(dateCreation.getTime() + randomBetween(1, 30) * 86400000);
      } else if (kycRoll < 0.90) {
        kyc_status = 'Pending';
        docId = Math.random() > 0.3;
        docDom = Math.random() > 0.5;
        docRev = Math.random() > 0.6;
        docUbo = false;
      } else {
        kyc_status = 'Rejected';
        docId = Math.random() > 0.5;
        docDom = Math.random() > 0.7;
        docRev = false;
        docUbo = false;
        rejReason = randomChoice([
          'Document d\'identité expiré',
          'Justificatif de domicile non conforme',
          'Informations incohérentes',
          'Document illisible',
          'Suspicion de faux documents',
        ]);
      }

      // Revenue based on client type
      let revenu;
      if (type_client === 'PME/Entreprise') revenu = randomBetween(200000, 5000000);
      else if (type_client === 'Professionnel') revenu = randomBetween(80000, 500000);
      else revenu = randomBetween(18000, 150000);

      kycRows.push({
        client_id: clientId,
        kyc_status,
        profession: randomChoice(PROFESSIONS),
        revenu_mensuel: revenu,
        adresse_postale: `${randomBetween(1, 200)} Rue ${faker.location.street()}, ${randomChoice(WILAYAS)}`,
        doc_identite_type: randomChoice(['Passeport', 'Carte Nationale', 'Permis de Conduire']),
        doc_identite_uploaded: docId,
        doc_identite_numero: `${randomBetween(100000000, 999999999)}`,
        justificatif_domicile_uploaded: docDom,
        justificatif_revenu_uploaded: docRev,
        declaration_ubo_uploaded: docUbo,
        rejection_reason: rejReason,
        date_verification: dateVerif,
        date_soumission: dateCreation,
      });

      // ── Accounts: 1-3 per client ──────────────────────
      const numAccounts = type_client === 'PME/Entreprise' ? randomBetween(2, 3) : randomBetween(1, 2);

      for (let a = 0; a < numAccounts; a++) {
        accountIndex++;
        const devise = a === 0 ? 'DZD' : randomChoice(['DZD', 'EUR', 'USD']);
        const typeCompte = a === 0 ? 'Courant' : randomChoice(['Courant', 'Epargne']);

        // Balance profiles
        let solde;
        const balanceProfile = Math.random();
        if (balanceProfile < 0.15) {
          // Wealthy: high balance
          solde = randomFloat(500000, 15000000);
        } else if (balanceProfile < 0.60) {
          // Standard: normal salary-level
          solde = randomFloat(20000, 200000);
        } else if (balanceProfile < 0.85) {
          // Low: paycheck-to-paycheck
          solde = randomFloat(500, 20000);
        } else if (balanceProfile < 0.93) {
          // Overdraft
          solde = randomFloat(-50000, -1000);
        } else {
          // Inactive / near-zero
          solde = randomFloat(0, 100);
        }

        // EUR/USD balances are smaller
        if (devise !== 'DZD') solde = parseFloat((solde / 140).toFixed(2));

        let status = 'Active';
        if (kyc_status === 'Rejected') status = Math.random() > 0.5 ? 'Suspended' : 'Active';
        if (balanceProfile > 0.96) status = 'Suspended';

        accountRows.push({
          account_id: accountIndex,
          client_id: clientId,
          numero_compte: generateAccountNumber(devise, accountIndex),
          type_compte: typeCompte,
          devise,
          solde_actuel: solde,
          status,
          date_ouverture: new Date(dateCreation.getTime() + a * randomBetween(1, 90) * 86400000),
        });

        allAccounts.push({ account_id: accountIndex, client_id: clientId, devise, solde_actuel: solde });
      }

      // ── Credits: ~30% of clients have loans ───────────
      if (Math.random() < 0.30) {
        const creditType = randomChoice(CREDIT_TYPES);
        let montant, taux, duree;

        if (creditType === 'Credit Immobilier') {
          montant = randomBetween(3000000, 25000000);
          taux = randomFloat(3.5, 7.0);
          duree = randomBetween(120, 300); // 10-25 years
        } else if (creditType === 'Credit Auto') {
          montant = randomBetween(500000, 4000000);
          taux = randomFloat(5.0, 9.0);
          duree = randomBetween(24, 84);
        } else if (creditType === 'Credit Professionnel') {
          montant = randomBetween(1000000, 10000000);
          taux = randomFloat(4.0, 8.0);
          duree = randomBetween(36, 120);
        } else {
          montant = randomBetween(50000, 1500000);
          taux = randomFloat(7.0, 14.0);
          duree = randomBetween(6, 60);
        }

        const monthlyRate = taux / 100 / 12;
        const mensualite = monthlyRate > 0
          ? (montant * monthlyRate * Math.pow(1 + monthlyRate, duree)) / (Math.pow(1 + monthlyRate, duree) - 1)
          : montant / duree;

        // Payment behavior
        let nombre_impayes = 0, jours_retard = 0, creditStatus = 'Active';
        const paymentProfile = Math.random();
        if (paymentProfile < 0.55) {
          // Perfect payer
          nombre_impayes = 0;
          jours_retard = 0;
        } else if (paymentProfile < 0.75) {
          // Occasional late
          nombre_impayes = randomBetween(1, 3);
          jours_retard = nombre_impayes * randomBetween(5, 30);
        } else if (paymentProfile < 0.90) {
          // Chronic late
          nombre_impayes = randomBetween(4, 8);
          jours_retard = nombre_impayes * randomBetween(20, 45);
        } else {
          // Defaulted
          nombre_impayes = randomBetween(6, 18);
          jours_retard = nombre_impayes * randomBetween(30, 60);
          creditStatus = 'Defaulted';
        }

        const dateDebut = randomDate(2019, 2025);
        const dateFin = new Date(dateDebut);
        dateFin.setMonth(dateFin.getMonth() + duree);

        // Compute remaining based on time elapsed
        const monthsElapsed = Math.max(1, Math.floor((Date.now() - dateDebut.getTime()) / (30 * 86400000)));
        const paidMonths = Math.min(monthsElapsed - nombre_impayes, duree);
        const montantRestant = Math.max(0, montant - (paidMonths * (montant / duree)));

        // If fully paid
        if (montantRestant <= 0 && creditStatus !== 'Defaulted') {
          creditStatus = 'Paid';
        }

        const firstAccountId = accountRows.find(a => a.client_id === clientId)?.account_id;
        if (firstAccountId) {
          creditRows.push({
            client_id: clientId,
            account_id: firstAccountId,
            type_credit: creditType,
            montant_initial: montant,
            montant_restant: Math.round(montantRestant * 100) / 100,
            taux_interet: taux,
            mensualite: Math.round(mensualite * 100) / 100,
            duree_mois: duree,
            nombre_impayes,
            jours_retard,
            status: creditStatus,
            date_debut: dateDebut,
            date_fin_prevue: dateFin,
          });
        }
      }
    }

    // Bulk insert this batch
    await Client.bulkCreate(clientRows, { ignoreDuplicates: true });
    await KycDetail.bulkCreate(kycRows, { ignoreDuplicates: true });
    await Account.bulkCreate(accountRows, { ignoreDuplicates: true });
    if (creditRows.length > 0) {
      await Credit.bulkCreate(creditRows);
    }

    const pct = Math.round((batchEnd / TOTAL_CLIENTS) * 100);
    process.stdout.write(`\r   Clients: ${batchEnd}/${TOTAL_CLIENTS} (${pct}%)`);
  }

  console.log('\n✅ Clients, KYC, Accounts & Credits created\n');

  // ────────────────────────────────────────────────────────────
  //  PHASE 2: Generate Transactions
  // ────────────────────────────────────────────────────────────
  const TOTAL_TRANSACTIONS = 60000;
  const TX_BATCH = 2000;
  console.log(`💸 Phase 2: Creating ${TOTAL_TRANSACTIONS} transactions...`);

  const activeAccounts = allAccounts.filter(a => a.solde_actuel > 0);

  for (let batch = 0; batch < Math.ceil(TOTAL_TRANSACTIONS / TX_BATCH); batch++) {
    const txRows = [];
    const batchStart = batch * TX_BATCH;
    const batchEnd = Math.min(batchStart + TX_BATCH, TOTAL_TRANSACTIONS);

    for (let i = batchStart; i < batchEnd; i++) {
      const txType = randomChoice(TX_TYPES);
      const canal = randomChoice(CHANNELS);
      const date = randomDate(2020, 2026);
      let emetteur = null, beneficiaire = null, montant, description;

      if (txType === 'Virement') {
        const sender = randomChoice(activeAccounts);
        let receiver = randomChoice(allAccounts);
        while (receiver.account_id === sender.account_id) {
          receiver = randomChoice(allAccounts);
        }
        emetteur = sender.account_id;
        beneficiaire = receiver.account_id;
        montant = randomFloat(500, Math.min(50000, Math.max(500, sender.solde_actuel)));
        description = `Virement interne`;
      } else if (txType === 'Depot') {
        const acct = randomChoice(allAccounts);
        beneficiaire = acct.account_id;
        montant = randomFloat(5000, 200000);
        description = randomChoice(['Versement salaire', 'Dépôt espèces', 'Virement reçu', 'Prime', 'Revenu locatif']);
      } else if (txType === 'Retrait') {
        const acct = randomChoice(activeAccounts);
        emetteur = acct.account_id;
        montant = randomFloat(1000, Math.min(30000, Math.max(1000, acct.solde_actuel)));
        description = randomChoice(['Retrait DAB', 'Retrait guichet', 'Retrait espèces']);
      } else if (txType === 'Paiement' || txType === 'Paiement TPE') {
        const acct = randomChoice(activeAccounts);
        emetteur = acct.account_id;
        montant = randomFloat(200, Math.min(15000, Math.max(200, acct.solde_actuel)));
        description = randomChoice([
          'Achat supermarché', 'Facture électricité', 'Facture internet',
          'Restaurant', 'Carburant', 'Abonnement', 'Achat en ligne',
          'Facture téléphone', 'Assurance', 'Loyer',
        ]);
      } else {
        // Prelevement
        const acct = randomChoice(activeAccounts);
        emetteur = acct.account_id;
        montant = randomFloat(500, Math.min(20000, Math.max(500, acct.solde_actuel)));
        description = randomChoice([
          'Prélèvement mensualité crédit', 'Prélèvement assurance',
          'Prélèvement impôts', 'Prélèvement abonnement', 'Prélèvement loyer',
        ]);
      }

      txRows.push({
        compte_emetteur: emetteur,
        compte_beneficiaire: beneficiaire,
        montant: Math.max(100, montant),
        devise: 'DZD',
        type_operation: txType,
        canal,
        description,
        device_ip: randomIP(),
        status: Math.random() < 0.97 ? 'Completed' : randomChoice(['Pending', 'Rejected']),
        date,
      });
    }

    await Transaction.bulkCreate(txRows);
    const pct = Math.round((batchEnd / TOTAL_TRANSACTIONS) * 100);
    process.stdout.write(`\r   Transactions: ${batchEnd}/${TOTAL_TRANSACTIONS} (${pct}%)`);
  }

  console.log('\n✅ Transactions created\n');

  // ────────────────────────────────────────────────────────────
  //  PHASE 3: Summary
  // ────────────────────────────────────────────────────────────
  const [clientCount, kycCount, accountCount, txCount, creditCount] = await Promise.all([
    Client.count(),
    KycDetail.count(),
    Account.count(),
    Transaction.count(),
    Credit.count(),
  ]);

  console.log('═══════════════════════════════════════════════════');
  console.log(' 🎉 SEEDING COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Clients:      ${clientCount.toLocaleString()}`);
  console.log(`   KYC Records:  ${kycCount.toLocaleString()}`);
  console.log(`   Accounts:     ${accountCount.toLocaleString()}`);
  console.log(`   Credits:      ${creditCount.toLocaleString()}`);
  console.log(`   Transactions: ${txCount.toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n   Admin login:  client1@riskvision.dz / password123`);
  console.log(`   Any client:   client<N>@riskvision.dz / password123\n`);

  await sequelize.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
