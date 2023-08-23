import { useContext } from "react"
import { UserContext } from "../contexts/user"
import { Navigate } from "react-router-dom"

export default function Private({children}) {

    const { signed, loading } = useContext(UserContext)

    if(loading) {
        return (
            <div className="loading">
                Carregando...
            </div>
        )
    }

    if(!signed) {
        return (
            <Navigate to='/login' />
        )
    }

    return children
}