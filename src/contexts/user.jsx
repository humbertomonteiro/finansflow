import { createContext, useState, useEffect } from "react";
import { auth, db } from "../FirebaseConnection";
import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, query, onSnapshot, where, collection, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { BsFillPersonFill, BsFillBagCheckFill } from 'react-icons/bs'
import { RiMoneyDollarCircleFill } from 'react-icons/ri'
import { FaWallet } from 'react-icons/fa'
import { FaEllipsis } from 'react-icons/fa6'
import { GrUserWorker } from 'react-icons/gr'
import { MdPointOfSale, MdFoodBank, MdAssignment } from 'react-icons/md'
import { TbAwardFilled } from 'react-icons/tb'
import { GiHealthNormal } from 'react-icons/gi'
import { AiFillHeart, AiFillCreditCard, AiFillCar} from 'react-icons/ai'
import { LuPalmtree } from 'react-icons/lu'
import { BiSolidHomeHeart } from 'react-icons/bi'
import { HiOutlineNewspaper } from 'react-icons/hi'
import { SlPresent } from 'react-icons/sl'
import { PiNewspaper } from 'react-icons/pi'

export const UserContext = createContext({})

const categoriesRevenues = [
    { id: 1, name: 'Pessoal', icon: <BsFillPersonFill /> },
    { id: 2, name: 'Salário', icon: <RiMoneyDollarCircleFill /> },
    { id: 3, name: 'Direitos', icon: <FaWallet />},
    { id: 4, name: 'Bicos', icon: <GrUserWorker /> },
    { id: 5, name: 'Vendas', icon: <MdPointOfSale /> },
    { id: 6, name: 'Premio', icon: <TbAwardFilled /> },
    { id: 7, name: 'Outros Receitas', icon: <FaEllipsis /> },
]

const categoriesExpenses = [
    { id: 7, name: 'Cuidados', icon: <AiFillHeart /> },
    { id: 8, name: 'Saúde', icon: <GiHealthNormal /> },
    { id: 9, name: 'Lazer', icon: <LuPalmtree /> },
    { id: 10, name: 'Moradia', icon: <BiSolidHomeHeart /> },
    { id: 11, name: 'Taxas', icon: <HiOutlineNewspaper /> },
    { id: 12, name: 'Presente', icon: <SlPresent /> },
    { id: 13, name: 'Pessoais', icon: <BsFillPersonFill /> },
    { id: 14, name: 'Outras Despesas', icon: <FaEllipsis /> },
    { id: 15, name: 'Alimentação', icon: <MdFoodBank /> },
    { id: 16, name: 'Assinaturas', icon: <MdAssignment /> },
    { id: 17, name: 'Cartão', icon: <AiFillCreditCard /> },
    { id: 18, name: 'Carro', icon: <AiFillCar /> },
    { id: 19, name: 'Compras', icon: <BsFillBagCheckFill /> },
    { id: 20, name: 'Contas', icon: <PiNewspaper /> },
]

export default function UserProvider({children}) {

    const navigate = useNavigate()

    const [ user, setUser ] = useState(null)
    const [ loading, setLoading ] = useState(true)
    const [ loadingAuth, setLoadingAuth ] = useState(false)
    const [ transactions, setTransactions ] = useState([])
    const currentDate = new Date()
    let [ monthSearch, setMonthSearch ] = useState(currentDate.getMonth() + 1)
    let [ yearSearch, setYearSearch ] = useState(currentDate.getFullYear())

    useEffect(() => {
        function handleTransactions() {
            // const dataLs = localStorage.getItem('@dataUserManager')
            // const userLs = JSON.parse(dataLs)
            const transactionsFs = collection(db,'transactions')
            const q = query(transactionsFs, where('user', '==', user ? user.uid : null))

            onSnapshot(q, snapshot => {
                let listTransactions = []

                snapshot.forEach(doc => {
                    listTransactions.push({
                        id: doc.id,
                        value: Number(doc.data().value).toFixed(2),
                        name: doc.data().name,
                        date: doc.data().date,
                        category: doc.data().category,
                        times: doc.data().times,
                        adress: doc.data().adress,
                        number: doc.data().number,
                        done: doc.data().done
                    })
                })

                setTransactions(listTransactions)
            })
        }

        handleTransactions()
    }, [user])

    useEffect(() => {
        async function checkLogin() {
            const lSUser = localStorage.getItem('@dataUserManager')

            if(lSUser) {
                setUser(JSON.parse(lSUser))
                setLoading(false)
            }

            setLoading(false)
        }

        checkLogin()
    }, [])

    async function signUp(name, email, password) {
        
        setLoadingAuth(true) 

        await createUserWithEmailAndPassword(auth, email, password)
            .then(async (value) => {
                let uid = value.user.uid

                await setDoc(doc(db, 'users', uid), {
                    name: name,
                    avatarUrl: null,
                })
                .then(() => {
                    
                    let data = {
                        uid: uid,
                        name: name,
                        email: value.user.email,
                        avatarUrl: null
                    }

                    setUser(data)
                    storageUser(data)
                    setLoadingAuth(false)
                    navigate('/dashboard')
                    toast.success(`Seja bem-vindo(a) ao nosso sistema ${data.name}`)
                })
            })
            .catch(error => {
                toast.error(`Erro ao cadastrar! ${error}`)
                setLoadingAuth(false)
            })
    }

    async function signIn(email, password) {
        setLoadingAuth(true) 

        await signInWithEmailAndPassword(auth, email, password)
            .then(async (value) => {
                let uid = value.user.uid

                const docRef = doc(db, 'users', uid) 
                const docSnap = await getDoc(docRef)

                let data = {
                    uid: uid,
                    name: docSnap.data().name,
                    email: value.user.email,
                    avatarUrl: docSnap.data().avatarUrl
                }

                setUser(data)
                storageUser(data)
                setLoadingAuth(false)
                toast.success(`Bem-vindo(a) de volta!`)
                navigate('/dashboard')
            })
            .catch(error => {
                setLoadingAuth(false)
                toast.error(`Erro ao fazer login! Error: ${error}`)
            })
    }

    async function logOut() {
        setLoadingAuth(true)

        await signOut(auth)
            .then(() => {
                localStorage.removeItem('@dataUserManager')
                setUser(null)
                toast.success('Vecê está deslogado!')
                setLoadingAuth(false)
                navigate('/')
            })
            .catch(error => toast.error('Error' + error))
    }

    function storageUser(data) {
        localStorage.setItem('@dataUserManager', JSON.stringify(data))
    }

    async function deleteFirebase(id, fb) {
        const docRef = doc(db, fb, id)

        setLoading(true)
        await deleteDoc(docRef)
            .then(() => {
                toast.success('Deletado com sucesso!')
                setLoading(false)
            })
    }


    return (
        <UserContext.Provider 
            value={{
                signed: !!user, 
                user,
                loadingAuth,
                loading,
                setLoading,
                signUp,
                signIn,
                logOut,
                storageUser,
                setUser,
                transactions,
                setTransactions,
                categoriesRevenues,
                categoriesExpenses,
                deleteFirebase,
                monthSearch,
                setMonthSearch,
                yearSearch,
                setYearSearch,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}