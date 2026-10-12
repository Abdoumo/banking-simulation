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

### 1. Get Clients
Retrieves a list of clients, including their KYC status and associated accounts.

- **Endpoint:** `GET /clients`
- **Query Parameters:** 
  - `limit` (optional): Number of records to return (default: 100). Example: `?limit=50`
- **Example Request (cURL):**
  ```bash
  curl -H "x-api-key: riskvision_external_share_key_999" "http://69.57.163.97:4545/api/open/clients?limit=5"
  ```
- **Example Request (JavaScript/Fetch):**
  ```javascript
  fetch('http://69.57.163.97:4545/api/open/clients', {
    headers: { 'x-api-key': 'riskvision_external_share_key_999' }
  })
  .then(res => res.json())
  .then(console.log);
  ```

### 2. Get Accounts
Retrieves a list of all bank accounts, their current balances, currencies, and their owner's basic information.

- **Endpoint:** `GET /accounts`
- **Query Parameters:** 
  - `limit` (optional): Number of records to return (default: 100).
- **Example Request (cURL):**
  ```bash
  curl -H "x-api-key: riskvision_external_share_key_999" "http://69.57.163.97:4545/api/open/accounts"
  ```

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
