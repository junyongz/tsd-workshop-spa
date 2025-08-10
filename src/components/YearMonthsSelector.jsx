import { Button, ButtonGroup, Dropdown, DropdownButton } from "react-bootstrap";
import { months3EngChars } from "../utils/dateUtils";
import { useEffect, useState } from "react";
import useTheme from "../utils/useTheme";

/**
 * 
 * @param {Object} props
 * @param {number[]} props.availableYears
 * @param {Function} props.changeYear
 * @param {Function} props.changeMonth
 * @param {number} props.year
 * @param {number} props.month
 * @returns 
 */
export default function YearMonthsSelector({availableYears, changeYear, changeMonth, year, month}) {
    const [monthView, setMonthView] = useState('terrace') // terrace or dropdown

    const theme = useTheme()

    const DropDownYears = () => {
        return (
            <DropdownButton aria-label="change year" id="dropdown-year" as={ButtonGroup} title={year} variant={((theme === 'dark') ? 'light': 'dark')} >
            { availableYears.map(
                v => <Dropdown.Item aria-label={`change to year ${v}`} key={v} onClick={() => changeYear(v)} eventKey={v}>{v}</Dropdown.Item> )
            }
            </DropdownButton> 
        )
    }

    /**
     * @param {number} i 
     * @returns 
     */
    const calcVariant = (i) => {
        return month === i ? ((theme === 'dark') ? 'outline-light': 'outline-dark') : ((theme === 'dark') ? 'light': 'dark')
    }

    useEffect(() => {
        const settingResponsiveMonthView = () => {
            if (window.matchMedia('(min-width: 992px)').matches) {
                setMonthView('terrace')
            }
            else {
                setMonthView('dropdown')
            }
        }
        settingResponsiveMonthView()

        window.addEventListener('resize', settingResponsiveMonthView)
    
        return () => {
          window.removeEventListener('resize', settingResponsiveMonthView)
        };
        
    }, []);

    return (
        <>
        <DropDownYears />
        { monthView === 'dropdown' && <ButtonGroup>
        
        <DropdownButton id="dropdown-month" as={ButtonGroup} title={months3EngChars[month]} variant={((theme === 'dark') ? 'light': 'dark')} >
            {
                months3EngChars.map((v, i) => 
                        <Dropdown.Item aria-label={`change to month ${v}`} key={v} variant={calcVariant(i)} onClick={() => changeMonth(i)}>{v}</Dropdown.Item>
                    )
            }
        </DropdownButton>
        </ButtonGroup> }

        { monthView === 'terrace' && <ButtonGroup>
            {
                months3EngChars.map((v, i) => 
                    <Button aria-label={`change to month ${v}`} key={v} variant={calcVariant(i)} onClick={() => changeMonth(i)}>{v}</Button>
                )
            }
        </ButtonGroup> }
        </>
    )
}