import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';

import { friendActions } from '../friendSlice'; 

function RequestToYou() {
  const dispatch = useDispatch()
  const [form, setForm] = useState<string>('')
  const {isSuccess} = useSelector((state:any) => state.friend)

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (form) {
      dispatch(friendActions.requestFriendStart(form))
    } else {
      alert('닉네임을 입력해주세요')
    }
  }

  useEffect(() => {
    if (isSuccess) {
      setForm('')
      dispatch(friendActions.setIsSuccess(false))
    }
  }, [isSuccess])

  const handleChangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    setForm(e.currentTarget.value)
  }

  return<>
    <h1>친구 신청 모달</h1>
    <form onSubmit={handleSubmit}>
      <label htmlFor="nickname">친구의 닉네임을 입력하세요</label>
      <input type="text" name="nickname" id="nickname" onChange={handleChangeInput} value={form} autoFocus />
      <button>친구 요청하기</button>
    </form>
  </>
}
export default RequestToYou