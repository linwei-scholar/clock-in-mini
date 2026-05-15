import Dexie from 'dexie'

export const db = new Dexie('CheckInSystemDB')

db.version(1).stores({
  users: '++id, username, createdAt',
  tags: '++id, userId, name, isDefault',
  plans: '++id, userId, name, status, startDate, endDate',
  records: '++id, planId, userId, checkInDate, checkInTime'
})

export const initDatabase = () => {
  return db.open().catch(err => {
    console.error('Failed to open database:', err)
  })
}

export const closeDatabase = () => {
  db.close()
}

export default db
