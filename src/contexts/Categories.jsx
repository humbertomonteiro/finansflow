import { BsFillPersonFill, BsFillBagCheckFill } from "react-icons/bs";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { FaWallet } from "react-icons/fa";
import { FaEllipsis, FaMoneyBill1Wave } from "react-icons/fa6";
import { GrUserWorker } from "react-icons/gr";
import { MdPointOfSale, MdFoodBank, MdAssignment } from "react-icons/md";
import { TbAwardFilled } from "react-icons/tb";
import { GiHealthNormal } from "react-icons/gi";
import { AiFillHeart, AiFillCreditCard, AiFillCar } from "react-icons/ai";
import { LuPalmtree } from "react-icons/lu";
import { BiSolidHomeHeart, BiHomeSmile } from "react-icons/bi";
import { HiOutlineNewspaper } from "react-icons/hi";
import { SlPresent } from "react-icons/sl";
import { PiNewspaper } from "react-icons/pi";

const categoriesRevenues = [
  { id: 1, name: "Pessoal", icon: <BsFillPersonFill /> },
  { id: 2, name: "Salário", icon: <RiMoneyDollarCircleFill /> },
  { id: 3, name: "Direitos", icon: <FaWallet /> },
  { id: 4, name: "Bicos", icon: <GrUserWorker /> },
  { id: 5, name: "Vendas", icon: <MdPointOfSale /> },
  { id: 6, name: "Premio", icon: <TbAwardFilled /> },
  { id: 7, name: "Aluguel", icon: <BiHomeSmile /> },
  { id: 8, name: "Emprestimos", icon: <FaMoneyBill1Wave /> },
  { id: 9, name: "Outras Rec...", icon: <FaEllipsis /> },
];

const categoriesExpenses = [
  { id: 10, name: "Cuidados", icon: <AiFillHeart /> },
  { id: 11, name: "Saúde", icon: <GiHealthNormal /> },
  { id: 12, name: "Lazer", icon: <LuPalmtree /> },
  { id: 13, name: "Moradia", icon: <BiSolidHomeHeart /> },
  { id: 14, name: "Taxas", icon: <HiOutlineNewspaper /> },
  { id: 15, name: "Presente", icon: <SlPresent /> },
  { id: 16, name: "Pessoais", icon: <BsFillPersonFill /> },
  { id: 17, name: "Outras", icon: <FaEllipsis /> },
  { id: 18, name: "Alimentação", icon: <MdFoodBank /> },
  { id: 19, name: "Assinaturas", icon: <MdAssignment /> },
  { id: 20, name: "Cartão", icon: <AiFillCreditCard /> },
  { id: 21, name: "Carro", icon: <AiFillCar /> },
  { id: 22, name: "Compras", icon: <BsFillBagCheckFill /> },
  { id: 23, name: "Contas Des...", icon: <PiNewspaper /> },
];

export { categoriesExpenses, categoriesRevenues };
