'use client'

import dynamic from 'next/dynamic'

const ChatWidget = dynamic(() => import('@/components/widget/ChatWidget'), { ssr: false })

export default function Home() {
  return <ChatWidget />
}
