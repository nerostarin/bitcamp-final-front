import React, { useEffect, useState } from 'react';
import axiosInstance from '../components/AxiosInstance';
import { FormProvider, StoryForm } from '../components/FormProvider';
import Swal from 'sweetalert2';
import { ButtonProvider } from './ButtonProvider';


const StoryUpdateModal = ({ storyId, mapId, isModal }) => {
    const [accessToken, setAccessToken] = useState(null);

    const [title, setTitle] = useState('');
    const [travelDate, setTravelDate] = useState('');
    const [content, setContent] = useState('');
    const [locationDetail, setLocationDetail] = useState('');
    const [files, setFiles] = useState([]);
    const [firstNames, setFirstNames] = useState([]);
    const [secondNames, setSecondNames] = useState([]);
    const [selectedFirstName, setSelectedFirstName] = useState('');
    const [selectedSecondName, setSelectedSecondName] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 월은 0부터 시작
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [checkedShare, setCheckedShare] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mainPhotoIndex, setMainPhotoIndex] = useState('');



    // 로컬 스토리지에서 accessToken을 가져오는 함수
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setAccessToken(token);
        } else {
            console.warn("Access token이 없습니다.");
        }
    }, []);



    useEffect(() => {
        if (accessToken) {
            const fetchStoryViewDTO = async () => {
                try {
                    const response = await axiosInstance.get(`/story/view/${storyId}`, {
                        params: {
                            share: false
                        },
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    const story = response.data;
                    setTitle(story.title);
                    setTravelDate(story.travelDate);
                    setContent(story.content);
                    setLocationDetail(story.locationDetail);
                    setSelectedFirstName(story.locationFirstName);
                    setSelectedSecondName(story.locationSecondName);
                    setCheckedShare(story.share);
                    setMainPhotoIndex(story.mainPhotoIndex);
                    setFiles(story.photos || []);
                    setLoading(false);  // 데이터를 불러온 후 로딩 상태를 false로 설정
                } catch (error) {
                    console.error("스토리를 가져오는 중 오류가 발생했습니다!", error);
                }
            };
            fetchStoryViewDTO();
        }
    }, [accessToken, storyId]);


    useEffect(() => {
        const fetchFirstNames = async () => {
            try {
                const response = await axiosInstance.get('/location/list');
                setFirstNames(response.data);
            } catch (error) {
                console.error("로케이션 가져오는 중 오류가 발생했습니다!", error);
            }
        };
        fetchFirstNames();
    }, []);

    useEffect(() => {
        const fetchSecondNames = async () => {
            if (selectedFirstName) {
                try {
                    const response = await axiosInstance.get(`/location/list/${selectedFirstName}`);
                    setSecondNames(response.data);
                } catch (error) {
                    console.error("두 번째 이름 가져오는 중 오류가 발생했습니다!", error);
                }
            } else {
                setSecondNames([]);
            }
        };
        fetchSecondNames();
    }, [selectedFirstName]);


    useEffect(() => {
        if (travelDate) {
            const [year, month, day] = travelDate.split('-');
            setSelectedYear(Number(year));
            setSelectedMonth(Number(month));
            setSelectedDay(Number(day));
        }
    }, [travelDate]);


    useEffect(() => {
        // 연도, 월, 일이 변경될 때 travelDate 업데이트
        setTravelDate(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`);
    }, [selectedYear, selectedMonth, selectedDay]);


    useEffect(() => {

    }, [title, travelDate, content, locationDetail, selectedFirstName, selectedSecondName, selectedYear, selectedMonth, selectedDay, files]);


    const handleSubmit = async (event) => {
        event.preventDefault();

        // 유효성 검사
        if (!title || !travelDate || !content) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "모든 필수 항목을 입력해주세요!",
            });
            return;
        }

        switch (true) {
            case (title.length >= 30): Swal.fire({
                icon: "error",
                text: "제목을 30자 이하로 입력해주세요.",
                toast: true,
                position: 'top',
                width: 380,
                showConfirmButton: false,
                timer: 2000, // 3초 후 자동 닫힘
            });
                return;
            case (locationDetail.length > 30): Swal.fire({
                icon: "error",
                text: "지역 상제정보를 30자 이하로 입력해주세요.",
                toast: true,
                position: 'top',
                width: 380,
                showConfirmButton: false,
                timer: 2000, // 3초 후 자동 닫힘
            });
                return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('travelDate', travelDate);
        formData.append('locationDetail', locationDetail);
        formData.append('content', content);
        formData.append('firstName', selectedFirstName);
        formData.append('secondName', selectedSecondName);
        formData.append('oldStoryId', storyId);
        formData.append('share', checkedShare);
        formData.append('mainPhotoIndex', mainPhotoIndex);

        let photos = [];
        files.forEach(file => {
            if (file instanceof File) {
                formData.append('files', file);
            } else if (file.path) {  // photo 객체인 경우
                photos.push(file);
            }
        });
        formData.append('photosJson', JSON.stringify(photos));


        try {
            formData.forEach((value, key) => {
                console.log(`${key}:`, value);
            });
            const response = await axiosInstance.post('/my-story/update', formData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            // console.log(formData.getAll('files'));

            Swal.fire({
                position: "top",
                icon: "success",
                title: "스토리가 업데이트되었습니다!",
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                // 3초 후 페이지 이동
                if (mapId) {
                    window.location.href = `/map/story/${mapId}`
                } else {
                    window.location.href = '/my-story/list';
                }
            });
        } catch (error) {
            console.error("스토리 업데이트 중 오류가 발생했습니다!", error);
        }
    };


    const handleButtonClick = () => {
        console.log("제출버튼 실행됨");
        handleSubmit(new Event('submit', { cancelable: true }));
    };


    const handleMainPhotoSelect = (index) => {
        setMainPhotoIndex(index); // Main 이미지
    };

    const handleCheckboxChange = (event) => {
        const checked = event.target.checked;
        setCheckedShare(checked);
        // console.log("Checkbox is checked:", checked);
    };


    useEffect(() => {
        if (files.length > 0) {
            // console.log("업로드된 파일들:", files);
        }


    }, [files]);


    // 파일 추가 로직을 변경하여 File 객체만 유지
    const onAddPhoto = (files) => {
        const uploadedFiles = Array.from(files);

        if (uploadedFiles.length > 0) {
            setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);

            // console.log(files)
            // 사진이 한 장만 업로드된 경우 mainPhotoIndex를 0으로 설정
            if (uploadedFiles.length === 1) {
                setMainPhotoIndex(0);
            }
        } else {
            console.warn("No files selected.");
        }
    };

    const onDeletePhoto = (photo) => {
        setFiles((prevFiles) => {
            // console.log("삭제하려는 파일:", photo);

            const updatedFiles = prevFiles.filter((file) => {
                // File 객체일 경우
                if (photo instanceof File) {
                    return file !== photo;
                }

                // Photo 객체일 경우
                return file.id !== photo.id;
            });

            // console.log("삭제 후 파일 리스트:", updatedFiles);
            return updatedFiles;
        });
    };

    const handleFileChange = (event) => {
        const uploadedFiles = Array.from(event.target.files);
        setFiles(uploadedFiles);

        // 사진이 한 장만 업로드된 경우 mainPhotoIndex를 0으로 설정
        if (uploadedFiles.length === 1) {
            setMainPhotoIndex(0);
        }
    };

    const formValue = {
        title, setTitle,
        selectedYear, setSelectedYear,
        selectedMonth, setSelectedMonth,
        selectedDay, setSelectedDay,
        selectedFirstName, setSelectedFirstName, firstNames,
        selectedSecondName, setSelectedSecondName, secondNames,
        locationDetail, setLocationDetail, handleFileChange,
        content, setContent,
        checkedShare, handleCheckboxChange,
        files, onAddPhoto, onDeletePhoto,
        mainPhotoIndex, handleMainPhotoSelect,
        handleButtonClick,
        handleSubmit
    }


    if (loading) {
        return <div>로딩 중...</div>;
    }


    return (
        <>
            <div className='modal__body'>
                <FormProvider value={formValue}>
                    <StoryForm />
                </FormProvider>
            </div>

            <div className='modal__footer'>
                <div className={`modal__content__item__center`}>

                </div>
                <ButtonProvider>
                    <button type="button" id="submit-button" className={`button button__primary`}
                        onClick={handleButtonClick}>
                        <span className={`button__text`}>수정</span>
                    </button>
                </ButtonProvider>
            </div>
        </>
    );
};

export default StoryUpdateModal;
