# Security Specification: Luminous Vision Quotation Archive

## 1. Data Invariants
- Quotations in `/saved_quotations/{quotationId}` must belong to valid alphanumeric document IDs with length <= 128.
- Each quotation must contain a valid `id`, `quoteNumber`, `createdAt`, and `grandTotal` (number).
- Quotations can be listed, retrieved, saved, and managed by company engineering personnel.
- Document IDs must match the quotation's internal `id` property to prevent ID poisoning.

## 2. Protected Entities
- Entity: `Quotation`
- Path: `/saved_quotations/{quotationId}`
- Fields:
  - `id`: string (<= 128 chars, matches `^[a-zA-Z0-9_\\-]+$`)
  - `quoteNumber`: string (<= 64 chars)
  - `createdAt`: string (<= 64 chars)
  - `grandTotal`: number (>= 0)
  - `clientInfo`: map/object
  - `items`: list

## 3. Negative Test Payloads (Dirty Dozen)
1. Injection attack: `quotationId` with path traversal `../../admin`
2. Malformed ID: `quotationId` with junk characters `!@#$%^&*()`
3. Oversized ID: ID longer than 128 characters
4. Missing required `quoteNumber`
5. Negative or non-number `grandTotal`
6. Oversized string payload exceeding volumetric limits
7. Unauthenticated write when strict auth is enabled
8. Tampered system metadata
9. Orphan write mismatching path variable and `data.id`
10. Malformed date format
11. Non-array items payload
12. Malicious script injection in client notes
