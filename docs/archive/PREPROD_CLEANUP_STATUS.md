# Preprod API Cleanup Status

## Current Status: IN PROGRESS

### APIs to Keep (Newest of each type):
1. ✅ `preprod-safemate-hedera-api` - ID: `2kwe2ly8vh` (created: 2025-08-27T10:56:44+10:00)
2. ✅ `preprod-safemate-vault-api` - ID: `fg85dzr0ag` (created: 2025-08-27T11:17:09+10:00)
3. ✅ `preprod-safemate-wallet-api` - ID: `9t9hk461kh` (created: 2025-08-27T11:17:19+10:00)
4. ✅ `preprod-safemate-group-api` - ID: `8a6qaslcbc` (created: 2025-08-27T11:17:29+10:00)
5. ✅ `preprod-safemate-directory-api` - ID: `e3k7nfvzab` (created: 2025-08-27T11:17:38+10:00)
6. ✅ `preprod-safemate-onboarding-api` - ID: `ol212feqdl` (created: 2025-08-27T11:08:27+10:00)

### Deleted APIs:
#### Hedera API Duplicates:
- ✅ `65t7l2jsx4` (created: 2025-08-27T10:52:21+10:00)
- ✅ `jwax34kfb5` (created: 2025-08-27T10:57:43+10:00)
- ✅ `h14gg6lehd` (created: 2025-08-27T11:08:11+10:00)

#### Vault API Duplicates:
- ✅ `1uqb0iknka` (created: 2025-08-27T11:08:43+10:00)
- ✅ `3qnwisrvu3` (created: 2025-08-27T10:55:48+10:00)
- ⏳ `7w6r13fsa0` (created: 2025-08-27T10:56:11+10:00) - PENDING
- ⏳ `tacmbtymy5` (created: 2025-08-27T11:13:32+10:00) - PENDING

#### Wallet API Duplicates:
- ⏳ `1fka5f40zj` (created: 2025-08-27T11:13:49+10:00) - PENDING
- ⏳ `whktbe667f` (created: 2025-08-27T11:09:04+10:00) - PENDING

#### Group API Duplicates:
- ⏳ `3r08ehzgk1` (created: 2025-08-27T11:09:30+10:00) - PENDING
- ⏳ `t9lsdgrt76` (created: 2025-08-27T11:14:07+10:00) - PENDING

#### Directory API Duplicates:
- ⏳ `f5d8g8xsx5` (created: 2025-08-27T11:09:49+10:00) - PENDING
- ⏳ `hq9yi5vtd0` (created: 2025-08-27T11:14:29+10:00) - PENDING

## Remaining Commands to Run:
```bash
# Vault API duplicates
aws apigateway delete-rest-api --rest-api-id 7w6r13fsa0 --region ap-southeast-2
aws apigateway delete-rest-api --rest-api-id tacmbtymy5 --region ap-southeast-2

# Wallet API duplicates
aws apigateway delete-rest-api --rest-api-id 1fka5f40zj --region ap-southeast-2
aws apigateway delete-rest-api --rest-api-id whktbe667f --region ap-southeast-2

# Group API duplicates
aws apigateway delete-rest-api --rest-api-id 3r08ehzgk1 --region ap-southeast-2
aws apigateway delete-rest-api --rest-api-id t9lsdgrt76 --region ap-southeast-2

# Directory API duplicates
aws apigateway delete-rest-api --rest-api-id f5d8g8xsx5 --region ap-southeast-2
aws apigateway delete-rest-api --rest-api-id hq9yi5vtd0 --region ap-southeast-2
```

## Final Result:
After cleanup, we should have exactly 6 preprod APIs (one of each type) plus 5 dev APIs = 11 total APIs.
