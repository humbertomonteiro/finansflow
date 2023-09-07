import { useContext } from "react"
import { UserContext } from "../../contexts/user"
import { toast } from "react-toastify"

export default function BtnDelete({ setState, dataUser }) {

    const { deleteFirebase } = useContext(UserContext)

    function handleDeleteTransaction() {
        deleteFirebase(dataUser.id, 'transactions')
        setState(false)
        toast.success('Deletado com sucesso!')
    }

    return (
        <button 
        className='bg-down'
        onClick={handleDeleteTransaction}>
            Apagar somente esta.
        </button>
    )
}