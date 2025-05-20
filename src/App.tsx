import './App.css'
import {Button} from "@/components/ui/button.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import {v4 as uuidv4} from 'uuid';
import {CheckCheck, CloudAlert} from "lucide-react";
import ReactMarkdown from 'react-markdown';

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
const DEEPSEEK_API_KEY = "sk-cdebb38846164c0489af7fc036e873b2"
const YOUR_BUSINESS_NAME = 'قاري سوفت للبرمجيات'
const StorageName = 'data8'

type MsgStatus = 'loading' | 'success' | 'failure'
type Msg = {
    isBot: boolean,
    msg: string,
    id: string,
    created_at: string,
    was_sent: MsgStatus,
}


function App() {
    const [loading, setLoading] = useState<boolean>(false)

    const getData = useCallback(() => {
        const data = window.localStorage.getItem(StorageName)
        if (data) {
            return JSON.parse(data)
        }
        return []
    }, [])
    const [data, setData] = useState<Msg[]>(getData())

    const saveMsg: (isBot: boolean, msg: string) => Msg = useCallback((isBot: boolean, msg: string) => {
        const msG: Msg = {
            isBot,
            msg,
            id: uuidv4(),
            created_at: new Date().toISOString(),
            was_sent: 'loading',
        }
        setData((d) => {
            return [...d, msG]
        })
        return msG

    }, [])

    const updateMessageStatus = useCallback((id: string, status: MsgStatus) => {
        setData((d) => {
            return d.map((m) => {
                if (m.id === id) {
                    return {
                        ...m,
                        was_sent: status,
                    }
                }
                return m
            })
        })
    }, [])

    const addCustomerMsg = useCallback((msg: string) => {
        return saveMsg(false, msg)

    }, [saveMsg])

    const addBotMsg = useCallback((msg: string) => {
        return saveMsg(true, msg)
    }, [saveMsg])

    const ask = async (question: string): Promise<string | undefined> => {
        const headers = {
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json"
        }
        const enhanced_prompt = `
    You are a customer service agent for 'Qarisoft Software Company', arabic name: ${YOUR_BUSINESS_NAME}. 
    Contact information: 054 585 6814.
    please use markdown only if you want to write code.
    Our services include: web development, mobile development, software development, and consulting.
    We use flutter, kotlin, and swift for mobile development.
    We use laravel, react, next-js, vue, angular, and Asp.Net for web development. 
    We use python,java,c#,.Net for software development.
    please use arabic language to respond to the customer as default unless the customer write in english.
    The customer asks: ${question}

    `
        const payload = {
            model: "deepseek-chat",
            messages: [{role: "user", content: enhanced_prompt}],
            temperature: 0.7
        }

        try {

            const rs = await axios({
                method: 'post',
                url: DEEPSEEK_API_URL,
                headers,
                data: payload
            })
            const response: string = rs.data.choices[0].message.content
            console.log(rs)
            return response ?? ''
            // return 'hi'
        } catch (e) {
            console.log(e)
            return undefined
        }
    }

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const msg_ = e.currentTarget.elements.namedItem('msg') as HTMLInputElement | undefined
        console.log(msg_?.value)
        if (msg_ == undefined) {
            return
        }
        const msg = msg_.value
        e.currentTarget.reset()
        if (msg != undefined) {
            const newMsg = addCustomerMsg(msg)
            try {
                setLoading(true)
                const res = await ask(msg)
                if (res != undefined) {
                    addBotMsg(res)
                    updateMessageStatus(newMsg.id, 'success')
                } else {
                    updateMessageStatus(newMsg.id, 'failure')

                }


            } catch (e) {
                console.log('\n\n ', e)
                updateMessageStatus(newMsg.id, 'failure')
            } finally {
                setLoading(false)
            }
        }


    }
    const dataRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (dataRef.current) {
            // dataRef.current.scrollTo()
            dataRef.current.scrollTo(0, dataRef.current.scrollHeight + 100)
        }
        window.localStorage.setItem(StorageName, JSON.stringify(data))
    }, [data])


    return (

        <div className={'flex justify-center h-dvh items-center p-2 bg-gray-100'}>
            <div dir={'rtl'}
                 className={'flex-1 flex flex-col h-[calc(100dvh-8px)] overflow-auto max-w-xl max-h-[700px] border rounded-md bg-white '}>
                <div className="w-full text-center p-2   ">Simple Chat bot</div>

                <div className="flex-1"></div>
                <div className="  flex flex-col  overflow-auto" ref={dataRef}>
                    {data.map((msg) => (
                            <Message msg={msg} key={msg.id}/>
                        )
                    )}
                    <div dir={'ltr'} className="">
                        {loading && (
                            <div className={"loading" + " "}>Loading...</div>
                        )}
                    </div>
                </div>
                <form className="flex gap-1 items-center p-1" onSubmit={onSubmit}>
                    <Button className="">
                        <SendSvg/>
                    </Button>
                    <textarea placeholder={'اكتب هنا'} className={'w-full p-2 border'} id={'msg'} name={'msg'}/>
                </form>
            </div>
        </div>
    )

}


function Message({msg, className}: { msg: Msg, className?: string }) {
    return <div className={'w-fit   flex p-2  ' + (msg.isBot ? 'mr-auto pr-8' : 'ml-auto pl-8')}>
        <div
            className={'bg-ard text-card-foreground  flex p-1   rounded-xl border  shadow-sm   ml-auto' + ' '
                + (msg.isBot ? 'rounded-bl-none' : 'rounded-br-none') + ' ' + (msg.isBot ? '' : (msg.was_sent == 'success' ? '  bg-blue-50 ' : ' bg-gray-100 ')) + className
            }>
            {msg.isBot ? (
                <div className={'max-w-[90vw] md:max-w-md  overflow-auto p-2'}>
                    <ReactMarkdown>{msg.msg}</ReactMarkdown>
                </div>
            ) : (
                <div className="p-2">{msg.msg}</div>
            )}
            {msg.isBot ? null : msg.was_sent === 'success' ? (

                <span className={'h-fit  mt-auto pb-2 '}><CheckCheck size={15} color={'blue'}/></span>
            ) : null}
        </div>
        {msg.isBot ? null : msg.was_sent === 'failure' ? (
            <div className={'flex items-center ps-2'}>
                <span className={'text-sm text-red-800'}><CloudAlert size={15}/></span>
            </div>
        ) : null}
    </div>
}


function SendSvg() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
        <path
            d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
        <path d="m21.854 2.147-10.94 10.939"></path>
    </svg>
}

export default App
