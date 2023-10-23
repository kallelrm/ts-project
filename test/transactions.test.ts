import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transaction routes', () => {
  beforeAll(async () => {
    execSync('npm run knex migrate:latest')
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('user can create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  test('user can list transactions', async () => {
    const postTransactionRes = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookie = postTransactionRes.get('Set-Cookie')

    const listTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookie)
      .expect(200)

    expect(listTransactions.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    ])
  })

  test('user can list a specific transaction', async () => {
    const postTransactionRes = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookie = postTransactionRes.get('Set-Cookie')

    const listTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookie)
      .expect(200)

    const transactionId = listTransactions.body.transactions[0].id

    const listSpecificTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookie)
      .expect(200)

    expect(listSpecificTransaction.body.transaction).toContain({
      id: transactionId,
      title: 'New transaction',
      amount: 5000,
    })
  })

  test.only('user can get summary', async () => {
    const postTransactionRes = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookie = postTransactionRes.get('Set-Cookie')

    await request(app.server).post('/transactions').set('Cookie', cookie).send({
      title: 'New transaction',
      amount: 4000,
      type: 'debit',
    })

    const listSummary = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookie)
      .expect(200)

    console.log(listSummary.body)

    expect(listSummary.body.summary).toEqual({
      amount: 1000,
    })
  })
})
