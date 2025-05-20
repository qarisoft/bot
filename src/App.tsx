import './App.css'
// import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
// import {Textarea} from "@/components/ui/textarea.tsx";
// import {Card, CardContent} from "@/components/ui/card.tsx";
import axios from "axios";
// import {useLocalStorage} from "@uidotdev/usehooks";
import {v4 as uuidv4} from 'uuid';
// import {Input} from "@/components/ui/input.tsx";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
const DEEPSEEK_API_KEY = "sk-cdebb38846164c0489af7fc036e873b2"
const YOUR_BUSINESS_NAME = 'قاري سوفت للبرمجيات'
const StorageName = 'data4'
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
    Contact information: +966 54 585 6814
    The customer asks: ${question}

    `
        const payload = {
            model: "deepseek-chat",
            messages: [{role: "user", content: enhanced_prompt}],
            temperature: 0.7
        }

        try {

            // const rs = await axios({
            //     method: 'post',
            //     url: DEEPSEEK_API_URL,
            //     headers,
            //     data: payload
            // })
            // const response: string = rs.data.choices[0].message.content
            // console.log(response)
            // return response ?? ''
            return 'hi'
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
            dataRef.current.scrollTo(0, dataRef.current.scrollHeight)
        }
        window.localStorage.setItem(StorageName, JSON.stringify(data))
    }, [data])


    // return (
    //     <div className={'flex flex-col h-dvh overflow-auto'}>
    //         <div className="bg-blue-100">ddd</div>
    //         <div className="bg-blue-200 flex-1">ddd</div>
    //         <div className="bg-blue-300">ddd</div>
    //     </div>
    // )
    return (
        <div className={'flex justify-center  bg-gray-100  items-center'} dir={'rtl'}>
            <div className="max-w-2xl flex-1 p-2 h-dvh overflow-y-auto flex  flex-col justify-center   ">
                <div className="w-full text-center p  ">Simple Chat bot</div>
                <div
                    className="relative flex-1 bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-2 shadow-sm">
                    <div className="flex-1"></div>
                    <div className="  flex flex-col overflow-auto " ref={dataRef}>
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
                    <form className="flex gap-1 items-center" onSubmit={onSubmit}>
                        <Button className="">
                            <SendSvg/>
                        </Button>
                        <textarea className={'w-full p-2 border'} id={'msg'} name={'msg'}/>
                    </form>
                </div>

            </div>

        </div>
    )
}


function Message({msg, className}: { msg: Msg, className?: string }) {
    return <div className={'w-fit  max-w-[calc(100dvw-50px)] flex p-2 ' + (msg.isBot ? 'mr-auto' : 'ml-auto')}>
        <div
            className={'bg-ard text-card-foreground  flex  rounded-xl border p-4 shadow-sm   ml-auto' + ' '
                + (msg.isBot ? 'rounded-bl-none' : 'rounded-br-none') + ' ' + (msg.isBot ? '' : '  bg-blue-50 ') + className
            }>
            <div className={' '} dir={'rtl'}>
                <div className="w-full ">
                    <div className="flex gap-1">

                        {/*{ReactHtmlParser(html_string)}*/}
                        <textarea disabled  value={msg.msg} className={'overflow-hidden'}  style={{resize:'none'}} />
                    </div>
                </div>
            </div>
        </div>
        {msg.was_sent == 'failure' && (
            <div>Error</div>
        )}
        {msg.was_sent == 'success' && (
            <div>t</div>
        )}

    </div>
}



function SendSvg() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
        <path
            d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
        <path d="m21.854 2.147-10.94 10.939"></path>
    </svg>
}

export default App
