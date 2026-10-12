# RiskVision Open API Documentation

The Open API allows external services to read data from the RiskVision banking system in a secure, read-only format.

## Authentication

All requests to the Open API must include the `x-api-key` header.
- **Header Key:** `x-api-key`
- **Default Value:** `riskvision_external_share_key_999` (Configurable via `API_KEY` in your `.env` file)

> ⚠ **Note:** If this header is missing or incorrect, the server will return a `401 Unauthorized` response.

---

## Base URL
All requests should be prefixed with:
```text
http://69.57.163.97:4545/api/open
```

---

## Endpoints

### 1. Get Clients (with 1/ KYC ENGINE & Account Variables)
Retrieves a list of clients, including their comprehensive 9-tab KYC profile, risk dimension scores, dynamic change detection alerts, and attached accounts.

- **Endpoint:** `GET /clients`
- **Query Parameters:** 
  - `limit` (optional): Number of records to return (default: 100). Example: `?limit=5`
- **Example Request (cURL):**
  ```bash
  curl -H "x-api-key: riskvision_external_share_key_999" "http://69.57.163.97:4545/api/open/clients?limit=5"
  ```
- **Example Response Structure:**
  ```json
  {
    "data": [
      {
        "client_id": 1245,
        "customer_id": "C-001245",
        "nom": "Benali",
        "prenom": "Noureddine",
        "type_client": "PME/Entreprise",
        "kyc_engine": {
          "status": "ACTIVE",
          "kyc_status": "VERIFIED",
          "risk_level": "MEDIUM",
          "kyc_score": 58,
          "change_score": 78,
          "ews_status": "EWS HIGH RISK",
          "last_review": "06/10/2026",
          "next_review": "06/10/2027",
          "identity": {
            "fullName": "Noureddine Benali",
            "nationality": "Algérienne",
            "identityVerification": "VERIFIED",
            "documentStatus": "VALID"
          },
          "business": {
            "profileType": "Company",
            "legalName": "Atlas Maghreb Import-Export SARL",
            "businessActivity": "Import / Export",
            "annualTurnover": "24,000,000 DA"
          },
          "financial": {
            "declaredIncome": "2,000,000 DA / mois",
            "declaredTurnover": "2,000,000 DA / mois",
            "sourceOfFunds": "Revenus d'activité commerciale Import/Export",
            "expectedMonthlyInflow": "2,000,000 DA",
            "expectedMonthlyOutflow": "1,800,000 DA"
          },
          "risk_engine": {
            "dimensions": {
              "identityRisk": { "score": 10, "max": 100 },
              "businessRisk": { "score": 35, "max": 100 },
              "financialRisk": { "score": 48, "max": 100 },
              "geographicRisk": { "score": 20, "max": 100 },
              "productRisk": { "score": 30, "max": 100 },
              "channelRisk": { "score": 42, "max": 100 },
              "behavioralRisk": { "score": 67, "max": 100 },
              "kycDataQuality": { "score": 5, "max": 100 }
            },
            "overallScore": 58,
            "riskLevel": "MEDIUM"
          },
          "behavior": {
            "baselineMonthlyTurnover": "20,000,000 DA",
            "observedTransactionsCount": 160,
            "counterpartiesBreakdown": [
              { "sector": "Entreprises Construction & BTP", "percentage": 64 },
              { "sector": "Paiements Grossistes & Matériaux", "percentage": 21 },
              { "sector": "Opérations Import / Export", "percentage": 15 }
            ]
          },
          "changes": {
            "profileChangeDetected": true,
            "changeScore": 78,
            "changeStatus": "SIGNIFICANT PROFILE CHANGE",
            "activityClassificationEngine": {
              "declaredActivity": "IMPORT / EXPORT",
              "observedActivity": "Wholesale / Construction",
              "activityConsistencyScore": 42,
              "activityConsistencyLabel": "LOW (ACTIVITY MISMATCH)"
            },
            "dynamicAlertEws": {
              "action": "Send to EWS",
              "signals": {
                "kycChange": 78,
                "transactionAnomaly": 82,
                "newBeneficiaryRisk": 75,
                "geographicRisk": 60
              },
              "ewsStatus": "EWS HIGH RISK"
            }
          }
        },
        "accounts": [
          {
            "accountId": 101,
            "numeroCompte": "100000124501",
            "typeCompte": "Courant Commercial",
            "devise": "DZD",
            "soldeActuel": 8450000,
            "status": "Active",
            "inflowMonthly": 18500000,
            "outflowMonthly": 17200000,
            "txCount30d": 120,
            "averageTxAmount": 297500,
            "accountRiskScore": 74,
            "alertLevel": "ANOMALY_WATCH"
          }
        ]
      }
    ]
  }
  ```

### 2. Get Accounts (with Risk & Velocity Metrics)
Retrieves bank accounts enriched with monthly inflows, outflows, transaction velocity (30d), and specific account risk score.

- **Endpoint:** `GET /accounts`
- **Query Parameters:** 
  - `limit` (optional): Number of records to return (default: 100).
- **Example Request (cURL):**
  ```bash
  curl -H "x-api-key: riskvision_external_share_key_999" "http://69.57.163.97:4545/api/open/accounts"
  ```
- **Returned Variables per Account:**
  - `account_id`, `numero_compte`, `type_compte`, `devise`, `solde_actuel`, `status`
  - `inflow_monthly`: Total monthly inbound funds (DA)
  - `outflow_monthly`: Total monthly outbound funds (DA)
  - `tx_count_30d`: Count of operations executed over the last 30 days
  - `average_tx_amount`: Average transaction amount (DA)
  - `account_risk_score`: Specific risk score computed for the account (0-100)
  - `alert_level`: `NORMAL` | `SURVEILLANCE` | `ANOMALY_WATCH`

### 3. Get Transactions (Ledger)
Retrieves the global ledger of transactions, showing movements between accounts, operation types, amounts, and dates.

- **Endpoint:** `GET /transactions`
- **Query Parameters:** 
  - `limit` (optional): Number of records to return (default: 100).
- **Example Request (cURL):**
  ```bash
  curl -H "x-api-key: riskvision_external_share_key_999" "http://69.57.163.97:4545/api/open/transactions"
  ```

---

## Error Handling

If a request fails, you will receive a JSON response with an `error` key:

```json
{
  "error": "Clé API (x-api-key) manquante ou invalide"
}
```
Standard HTTP status codes are used:
- `200 OK` — Success
- `401 Unauthorized` — Bad API Key
- `500 Internal Server Error` — Server issue (e.g., database connection failed)
