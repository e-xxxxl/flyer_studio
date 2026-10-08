import { useEffect } from 'react'
import { Shell } from './components/Shell'
import { ToastProvider } from './components/ui'
import { UpdatePrompt } from './components/UpdatePrompt'
import { useRoute } from './lib/router'
import BirthdaysPage from './pages/BirthdaysPage'
import EditorPage from './pages/EditorPage'
import FlyersPage from './pages/FlyersPage'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import TemplatesPage from './pages/TemplatesPage'

const TITLES: Record<string, string> = {
  home: 'Home',
  flyers: 'Flyers',
  templates: 'Templates',
  birthdays: 'Birthdays',
  settings: 'Settings',
  editor: 'Editor',
}

export default function App() {
  const route = useRoute()

  useEffect(() => {
    document.title = `${TITLES[route.name]} | Flyer Studio`
    window.scrollTo(0, 0)
  }, [route.name])

  let page
  switch (route.name) {
    case 'editor':
      // keyed so opening another flyer starts with fresh state
      page = <EditorPage key={`${route.id}?${route.query.toString()}`} id={route.id} query={route.query} />
      break
    case 'flyers':
      page = <FlyersPage />
      break
    case 'templates':
      page = <TemplatesPage />
      break
    case 'birthdays':
      page = <BirthdaysPage />
      break
    case 'settings':
      page = <SettingsPage />
      break
    default:
      page = <HomePage />
  }

  return (
    <ToastProvider>
      {route.name === 'editor' ? page : <Shell>{page}</Shell>}
      <UpdatePrompt />
    </ToastProvider>
  )
}
