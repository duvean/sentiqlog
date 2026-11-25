import Dexie, { type EntityTable } from 'dexie'

export type Feeling = { id: string; name: string; color: string; before: number; after: number }
export type Thought = { id: string; text: string; confidence: number }
export type Entry = {
  id: string
  date: string
  createdAt: number
  updatedAt: number
  person: string
  what: string
  when: string
  where: string
  feelings: Feeling[]
  automaticThoughts: string
  hotThought: string
  evidenceFor: string[]
  evidenceAgainst: string[]
  alternatives: Thought[]
}

export type Profile = { key: 'profile'; name: string }

const db = new Dexie('sentiqlog') as Dexie & {
  entries: EntityTable<Entry, 'id'>
  profile: EntityTable<Profile, 'key'>
}

db.version(1).stores({ entries: 'id, date, updatedAt', profile: 'key' })
export { db }
