import './account.css'
import { useContext, useState } from 'react'
import { UserContext } from '../../contexts/user'
import { BsFillPencilFill } from 'react-icons/bs'
import { FaArrowRightFromBracket } from 'react-icons/fa6'
import { AiOutlineEdit } from 'react-icons/ai'
import { FiUpload } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { db, storage } from '../../FirebaseConnection'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function Account() {

    const { user, logOut, storageUser, setUser } = useContext(UserContext)

    const [ name, setName ] = useState(user && user.name)
    const [ avatarUrl, setAvatarUrl ] = useState(user && user.avatarUrl)
    const [ imgAvatar, setImageAvatar ] = useState(null)
    
    function handleFile(e) {
        if(e.target.value[0]) {
            const image = e.target.files[0]

            if(image.type === 'image/jpeg' || image.type === 'image/png') {
                setImageAvatar(image)
                setAvatarUrl(URL.createObjectURL(image))
            } else {
                toast.error("Selecione uma imagem 'JPEG' ou 'PNG'")
                setImageAvatar(null)
                return
            }
        }
    }

    async function handleUpload() {
        const currentUid = user.uid

        const uploadRef = ref(storage, `images/${currentUid}/${imgAvatar.name}`)

        uploadBytes(uploadRef, imgAvatar)
            .then((snapshot) => {

                getDownloadURL(snapshot.ref).then(async (url) => {
                    let urlImg = url
                    const docRef = doc(db, 'users', user.uid)
                    await updateDoc(docRef, {
                        avatarUrl: urlImg,
                        name: name
                    })
                    .then(() => {
                        let data = {
                            ...user,
                            name: name,
                            avatarUrl: urlImg
                        }
        
                        setUser(data)
                        storageUser(data)
                        toast.success('Atualizado com sucesso!')
                    })
                })
            })
    }

    async function handleEdit(e) {
        e.preventDefault()

        if(imgAvatar === null && name !== '') {
            const docRef = doc(db, 'users', user.uid)

            await updateDoc(docRef, {
                name: name
            })
            .then(() => {
                let data = {
                    ...user,
                    name: name,
                }

                setUser(data)
                storageUser(data)
                toast.success('Nome atualizado com sucesso!')
            })
            .catch(error => {
                toast.error('Erro ao atualizar! Porfavor tente novamente.')
            })
        } else if(name !== '' && imgAvatar !== null) {
            handleUpload()
        }
    }

    return (
        <main className='container-account'>
            <div data-aos='zoom-out' className="board">
                <h1>Meu perfil</h1>
                <button className='btn-default' onClick={logOut}>Sair da conta <FaArrowRightFromBracket /></button>
            </div>

            <div data-aos='fade-down' className="boxes-account">

                <div className="box-account">
                    <h2>Dados da conta</h2>
                    <form onSubmit={handleEdit}>
                        <div className='data-account'>
                            <label>
                                <p><BsFillPencilFill /> Editar nome</p>
                                <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={user?.name} />
                            </label>
                            <label>
                                <p>Email</p>
                                <input
                                type="text"
                                disabled
                                placeholder={user?.email} />
                            </label>
                            <button className='btn-default' type='submit'>Editar dados <AiOutlineEdit /></button>

                        </div>

                        <div className="avatar-account">
                            <label>
                                <p>Foto do perfil</p>
                                <span><FiUpload /></span>
                                <input 
                                type="file" 
                                accept='image/*'
                                onChange={handleFile}/>
                                {
                                    avatarUrl === null ? 
                                    <img src={require('../../assets/imgs/avater-default.jpg')} alt="Foto de perfil" /> 
                                    :
                                    <img src={avatarUrl} alt="Foto de perfil" /> 
                                }
                            </label>
                        </div>
                        
                    </form>
                </div>

            </div>
        </main>
    )
}