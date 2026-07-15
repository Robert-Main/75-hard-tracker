/* global self, clients, indexedDB */

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
      return undefined
    }),
  )
})

function openReminderDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('seventy-five-hard-reminders', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('snapshot')) {
        db.createObjectStore('snapshot')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function readSnapshot(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('snapshot', 'readonly')
    const req = tx.objectStore('snapshot').get('current')
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

function writeSnapshot(db, snapshot) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('snapshot', 'readwrite')
    tx.objectStore('snapshot').put(snapshot, 'current')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function currentHour(date = new Date()) {
  return String(date.getHours()).padStart(2, '0')
}

async function checkRemindersFromSnapshot() {
  const db = await openReminderDb()
  const snapshot = await readSnapshot(db)
  if (!snapshot || !snapshot.enabled || !snapshot.hasActiveChallenge) {
    db.close()
    return
  }
  if (snapshot.dayComplete) {
    db.close()
    return
  }

  const hour = currentHour()
  if (snapshot.lastFiredHour === hour) {
    db.close()
    return
  }

  await self.registration.showNotification('75 Hard', {
    body: 'Hourly check-in — finish today’s 75 Hard tasks.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: '75-hard-workout-reminder',
    renotify: true,
    data: { url: '/' },
  })

  await writeSnapshot(db, { ...snapshot, lastFiredHour: hour })
  db.close()
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === '75-hard-reminders') {
    event.waitUntil(checkRemindersFromSnapshot())
  }
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_REMINDERS') {
    event.waitUntil(checkRemindersFromSnapshot())
  }
})
