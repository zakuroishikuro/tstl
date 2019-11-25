//================================================================ 
/** @module std */
//================================================================
import { IForwardIterator } from "../iterator/IForwardIterator";
import { IRandomAccessIterator } from "../iterator/IRandomAccessIterator";
import { IPointer } from "../functional/IPointer";

import { General } from "../iterator/IFake";
import { less } from "../functional/comparators";
import { iter_swap, copy } from "./modifiers";
import { distance } from "../iterator/global";

import { Vector } from "../container/Vector";
import { Temporary } from "../base/Temporary";

/**
 * @hidden
 */
type Comparator<Iterator extends IForwardIterator<IPointer.ValueType<Iterator>, Iterator>> =
    (
        x: IPointer.ValueType<Iterator>,
        y: IPointer.ValueType<Iterator>
    ) => boolean;

/* =========================================================
    SORTINGS
        - SORT
        - INSPECTOR
        - BACKGROUND
============================================================
    SORT
--------------------------------------------------------- */
/**
 * Sort elements in range.
 * 
 * @param first Random access iterator of the first position.
 * @param last Random access iterator of the last position.
 * @param comp A binary function predicates *x* element would be placed before *y*. When returns `true`, then *x* precedes *y*. Default is {@link less}.
 */
export function sort<RandomAccessIterator extends General<IRandomAccessIterator<IPointer.ValueType<RandomAccessIterator>, RandomAccessIterator>>>
    (
        first: RandomAccessIterator, last: RandomAccessIterator, 
        comp: Comparator<RandomAccessIterator> = less
    ): void
{
    let size: number = last.index() - first.index();
    if (size <= 0)
        return;

    let pivot_it: RandomAccessIterator = first.advance(Math.floor(size / 2));
    let pivot: IPointer.ValueType<RandomAccessIterator> = pivot_it.value;

    if (pivot_it.index() !== first.index())
        iter_swap(first, pivot_it);
    
    let i: number = 1;
    for (let j: number = 1; j < size; ++j)
    {
        let j_it: RandomAccessIterator = first.advance(j);
        if (comp(j_it.value, pivot))
        {
            iter_swap(j_it, first.advance(i));
            ++i;
        }
    }
    iter_swap(first, first.advance(i - 1));

    sort(first, first.advance(i-1), comp);
    sort(first.advance(i), last, comp);
}

/**
 * Sort elements in range stably.
 * 
 * @param first Random access iterator of the first position.
 * @param last Random access iterator of the last position.
 * @param comp A binary function predicates *x* element would be placed before *y*. When returns `true`, then *x* precedes *y*. Default is {@link less}.
 */
export function stable_sort<RandomAccessIterator extends General<IRandomAccessIterator<IPointer.ValueType<RandomAccessIterator>, RandomAccessIterator>>>
    (
        first: RandomAccessIterator, last: RandomAccessIterator, 
        comp: Comparator<RandomAccessIterator> = less
    ): void
{
    let ramda = function (x: IPointer.ValueType<RandomAccessIterator>, y: IPointer.ValueType<RandomAccessIterator>): boolean
    {
        return comp(x, y) && !comp(y, x);
    };
    sort(first, last, ramda);
}

/**
 * Sort elements in range partially.
 * 
 * @param first Random access iterator of the first position.
 * @param middle Random access iterator of the middle position between [first, last). Elements only in [first, middle) are fully sorted.
 * @param last Random access iterator of the last position.
 * @param comp A binary function predicates *x* element would be placed before *y*. When returns `true`, then *x* precedes *y*. Default is {@link less}.
 */
export function partial_sort<RandomAccessIterator extends General<IRandomAccessIterator<IPointer.ValueType<RandomAccessIterator>, RandomAccessIterator>>>
    (
        first: RandomAccessIterator, middle: RandomAccessIterator, last: RandomAccessIterator, 
        comp: Comparator<RandomAccessIterator> = less
    ): void
{
    for (let i = first; !i.equals(middle); i = i.next())
    {
        let min: RandomAccessIterator = i;

        for (let j = i.next(); !j.equals(last); j = j.next())
            if (comp(j.value, min.value))
                min = j;
        
            if (!i.equals(min))
                iter_swap(i, min);
    }
}

/**
 * Copy elements in range with partial sort.
 * 
 * @param first Input iteartor of the first position.
 * @param last Input iterator of the last position.
 * @param output_first Output iterator of the first position.
 * @param output_last Output iterator of the last position.
 * @param comp A binary function predicates *x* element would be placed before *y*. When returns `true`, then *x* precedes *y*. Default is {@link less}.
 * 
 * @return Output Iterator of the last position by advancing.
 */
export function partial_sort_copy<
        InputIterator extends Readonly<IForwardIterator<IPointer.ValueType<InputIterator>, InputIterator>>, 
        OutputIterator extends General<IForwardIterator<IPointer.ValueType<InputIterator>, OutputIterator>>>
    (
        first: InputIterator, last: InputIterator, 
        output_first: OutputIterator, output_last: OutputIterator, 
        comp: Comparator<InputIterator> = less
    ): OutputIterator
{
    let input_size: number = distance(first, last);
    let result_size: number = distance(<Temporary>output_first, output_last);

    let vector: Vector<IPointer.ValueType<InputIterator>> = new Vector(first, last);
    sort(vector.begin(), vector.end(), <Temporary>comp);

    if (input_size > result_size)
        output_first = copy(vector.begin(), vector.begin().advance(result_size), output_first);
    else
        output_first = copy(vector.begin(), vector.end(), output_first);

    return output_first;
}

/**
 * Rearrange for the n'th element.
 * 
 * @param first Random access iterator of the first position.
 * @param nth Random access iterator the n'th position.
 * @param last Random access iterator of the last position.
 * @param comp A binary function predicates *x* element would be placed before *y*. When returns `true`, then *x* precedes *y*. Default is {@link less}.
 */
export function nth_element<RandomAccessIterator extends General<IRandomAccessIterator<IPointer.ValueType<RandomAccessIterator>, RandomAccessIterator>>>
    (
        first: RandomAccessIterator, nth: RandomAccessIterator, last: RandomAccessIterator, 
        comp: Comparator<RandomAccessIterator> = less
    ): void
{
    let n: number = distance(first, nth);
    for (let i = first; !i.equals(last); i = i.next())
    {
        let count: number = 0;
        for (let j = first; !j.equals(last); j = j.next())
            if (i.equals(j))
                continue;
            else if (comp(i.value, j.value) && ++count > n)
                break;

        if (count === n)
        {
            iter_swap(nth, i);
            return;
        }
    }
}

/* ---------------------------------------------------------
    INSPECTOR
--------------------------------------------------------- */
/**
 * Test whether a range is sorted.
 * 
 * @param first Input iterator of the first position.
 * @param last Input iterator of the last position.
 * @param comp A binary function predicates *x* element would be placed before *y*. When returns `true`, then *x* precedes *y*. Default is {@link less}.
 * 
 * @return Whether sorted or not.
 */
export function is_sorted<InputIterator extends Readonly<IForwardIterator<IPointer.ValueType<InputIterator>, InputIterator>>>
    (
        first: InputIterator, last: InputIterator, 
        comp: Comparator<InputIterator> = less
    ): boolean
{
    return is_sorted_until(first, last, comp).equals(last);
}

/**
 * Find the first unsorted element in range.
 * 
 * @param first Input iterator of the first position.
 * @param last Input iterator of the last position.
 * @param comp A binary function predicates *x* element would be placed before *y*. When returns `true`, then *x* precedes *y*. Default is {@link less}.
 * 
 * @return Iterator to the first element who violates the order.
 */
export function is_sorted_until<InputIterator extends Readonly<IForwardIterator<IPointer.ValueType<InputIterator>, InputIterator>>>
    (
        first: InputIterator, last: InputIterator, 
        comp: Comparator<InputIterator> = less
    ): InputIterator
{
    if (first.equals(last))
        return last;
    
    for (let next = first.next(); !next.equals(last); next = next.next())
        if (comp(next.value, first.value))
            return next;
        else
            first = first.next();
    
    return last;
}